import { z } from "zod";
import { PASSWORD_MAX_LENGTH, type Role } from "./user";

export const loginSchema = z.object({
  username: z
    .string({ error: "Informe o usuário" })
    .trim()
    .toLowerCase()
    .min(1, "Informe o usuário")
    .max(60, "Usuário inválido"),
  password: z
    .string({ error: "Informe a senha" })
    .min(1, "Informe a senha")
    .max(PASSWORD_MAX_LENGTH, "Senha inválida"),
});

export type LoginData = z.output<typeof loginSchema>;

const INVALID_SESSION_MESSAGE = "Sessão inválida. Entre novamente.";

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ error: INVALID_SESSION_MESSAGE })
    .min(1, INVALID_SESSION_MESSAGE)
    .max(512, INVALID_SESSION_MESSAGE),
});

export type RefreshTokenData = z.output<typeof refreshTokenSchema>;

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface SessionTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface LoginResponse extends SessionTokens {
  user: SessionUser;
}
