import jwt, { type Algorithm } from "jsonwebtoken";
import type {
  AccessTokenService,
  IssuedAccessToken,
  VerifiedAccessToken,
} from "../../modules/auth/ports";
import type { Clock } from "../../shared/clock";

export const ACCESS_TOKEN_ISSUER = "imc-calculator-api";
export const ACCESS_TOKEN_AUDIENCE = "imc-calculator";
const SIGNING_ALGORITHM: Algorithm = "HS256";

export interface JsonwebtokenAccessTokenConfig {
  secret: string;
  ttlMinutes: number;
  clock: Clock;
}

function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export class JsonwebtokenAccessTokenService implements AccessTokenService {
  constructor(private readonly config: JsonwebtokenAccessTokenConfig) {}

  issue(userId: string): IssuedAccessToken {
    const issuedAtInSeconds = toUnixSeconds(this.config.clock());
    const expiresAtInSeconds = issuedAtInSeconds + this.config.ttlMinutes * 60;

    const token = jwt.sign(
      { iat: issuedAtInSeconds, exp: expiresAtInSeconds },
      this.config.secret,
      {
        algorithm: SIGNING_ALGORITHM,
        subject: userId,
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      },
    );

    return { token, expiresAt: new Date(expiresAtInSeconds * 1000) };
  }

  verify(accessToken: string): VerifiedAccessToken | null {
    try {
      const accessTokenPayload = jwt.verify(accessToken, this.config.secret, {
        algorithms: [SIGNING_ALGORITHM],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        clockTimestamp: toUnixSeconds(this.config.clock()),
      });
      if (typeof accessTokenPayload === "string" || !accessTokenPayload.sub) return null;
      return { userId: accessTokenPayload.sub };
    } catch (verificationError) {
      if (verificationError instanceof jwt.JsonWebTokenError) return null;
      throw verificationError;
    }
  }
}
