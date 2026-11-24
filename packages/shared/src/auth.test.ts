import { describe, expect, it } from "vitest";
import { loginSchema, refreshTokenSchema } from "./auth";
import { PASSWORD_MAX_LENGTH } from "./user";

describe("loginSchema", () => {
  it("normalizes the username the same way as the registration", () => {
    expect(loginSchema.parse({ username: " Admin ", password: "x" }).username).toBe(
      "admin",
    );
  });

  it.each([
    [{ username: "", password: "secret-123" }, "Informe o usuário"],
    [{ username: "admin", password: "" }, "Informe a senha"],
    [{ username: "a".repeat(61), password: "secret-123" }, "Usuário inválido"],
    [
      { username: "admin", password: "a".repeat(PASSWORD_MAX_LENGTH + 1) },
      "Senha inválida",
    ],
  ])("rejects %j with %s", (credentials, expectedMessage) => {
    expect(loginSchema.safeParse(credentials).error?.issues[0]?.message).toBe(
      expectedMessage,
    );
  });
});

describe("refreshTokenSchema", () => {
  it("rejects a missing token with a Portuguese message", () => {
    expect(
      refreshTokenSchema.safeParse({ refreshToken: "" }).error?.issues[0]?.message,
    ).toBe("Sessão inválida. Entre novamente.");
  });
});
