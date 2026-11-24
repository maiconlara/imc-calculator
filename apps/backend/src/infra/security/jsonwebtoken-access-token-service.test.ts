import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  JsonwebtokenAccessTokenService,
} from "./jsonwebtoken-access-token-service";

const SECRET = "test-secret-with-at-least-32-characters";
const USER_ID = "5f0c2a1e-8b7d-4c3a-9e6f-1a2b3c4d5e6f";
const ISSUED_AT = new Date("2026-11-19T12:00:00.000Z");
const ISSUED_AT_IN_SECONDS = ISSUED_AT.getTime() / 1000;

function createAccessTokenService(currentTime: { value: Date }) {
  return new JsonwebtokenAccessTokenService({
    secret: SECRET,
    ttlMinutes: 15,
    clock: () => currentTime.value,
  });
}

function signWithSecret(claims: object, secret: string): string {
  return jwt.sign(
    { iat: ISSUED_AT_IN_SECONDS, exp: ISSUED_AT_IN_SECONDS + 900, ...claims },
    secret,
    { algorithm: "HS256" },
  );
}

function buildUnsignedToken(claims: object): string {
  const encodeTokenPart = (tokenPart: object) =>
    Buffer.from(JSON.stringify(tokenPart)).toString("base64url");
  return `${encodeTokenPart({ alg: "none", typ: "JWT" })}.${encodeTokenPart(claims)}.`;
}

describe("JsonwebtokenAccessTokenService", () => {
  it("issues an HS256 token with the user as subject, issuer, audience and expiration", () => {
    const accessTokenService = createAccessTokenService({ value: ISSUED_AT });

    const issuedAccessToken = accessTokenService.issue(USER_ID);

    expect(issuedAccessToken.expiresAt).toEqual(new Date("2026-11-19T12:15:00.000Z"));
    expect(jwt.decode(issuedAccessToken.token, { complete: true })).toMatchObject({
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        sub: USER_ID,
        iss: ACCESS_TOKEN_ISSUER,
        aud: ACCESS_TOKEN_AUDIENCE,
        iat: ISSUED_AT_IN_SECONDS,
        exp: ISSUED_AT_IN_SECONDS + 900,
      },
    });
  });

  it("verifies its own token until it expires", () => {
    const currentTime = { value: ISSUED_AT };
    const accessTokenService = createAccessTokenService(currentTime);
    const { token } = accessTokenService.issue(USER_ID);

    currentTime.value = new Date("2026-11-19T12:14:59.000Z");
    expect(accessTokenService.verify(token)).toEqual({ userId: USER_ID });

    currentTime.value = new Date("2026-11-19T12:15:00.000Z");
    expect(accessTokenService.verify(token)).toBeNull();
  });

  it.each([
    [
      "another secret",
      signWithSecret(
        { sub: USER_ID, iss: ACCESS_TOKEN_ISSUER, aud: ACCESS_TOKEN_AUDIENCE },
        "another-secret-with-at-least-32-characters",
      ),
    ],
    [
      "another issuer",
      signWithSecret(
        { sub: USER_ID, iss: "another-api", aud: ACCESS_TOKEN_AUDIENCE },
        SECRET,
      ),
    ],
    [
      "another audience",
      signWithSecret(
        { sub: USER_ID, iss: ACCESS_TOKEN_ISSUER, aud: "another-app" },
        SECRET,
      ),
    ],
    [
      "no subject",
      signWithSecret({ iss: ACCESS_TOKEN_ISSUER, aud: ACCESS_TOKEN_AUDIENCE }, SECRET),
    ],
    [
      "no signature",
      buildUnsignedToken({
        sub: USER_ID,
        iss: ACCESS_TOKEN_ISSUER,
        aud: ACCESS_TOKEN_AUDIENCE,
        iat: ISSUED_AT_IN_SECONDS,
        exp: ISSUED_AT_IN_SECONDS + 900,
      }),
    ],
    ["a value that is not a JWT", "not-a-jwt"],
  ])("rejects a token with %s", (_case, accessToken) => {
    const accessTokenService = createAccessTokenService({ value: ISSUED_AT });

    expect(accessTokenService.verify(accessToken)).toBeNull();
  });
});
