import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../shared/errors";
import type { User } from "../users/user";
import { AuthService } from "./auth.service";
import type {
  AccessTokenService,
  PasswordHasher,
  RefreshTokenRepository,
  StoredRefreshToken,
} from "./ports";

const NOW = new Date("2026-11-19T12:00:00.000Z");

function createAuthService(options: {
  user?: User | null;
  storedRefreshToken?: StoredRefreshToken | null;
}) {
  const passwordHasher = {
    compare: vi.fn<PasswordHasher["compare"]>(async () => false),
  };
  const refreshTokenRepository: RefreshTokenRepository = {
    save: vi.fn(async () => undefined),
    findByHash: vi.fn(async () => options.storedRefreshToken ?? null),
    updateExpiration: vi.fn(async () => undefined),
    deleteByHash: vi.fn(async () => undefined),
    deleteAllOfUser: vi.fn(async () => undefined),
    deleteExpiredOfUser: vi.fn(async () => undefined),
  };
  const accessTokenService: AccessTokenService = {
    issue: vi.fn(() => ({ token: "access-token", expiresAt: NOW })),
    verify: vi.fn(() => null),
  };

  const authService = new AuthService({
    userRepository: {
      findById: async () => options.user ?? null,
      findByUsername: async () => options.user ?? null,
    },
    refreshTokenRepository,
    passwordHasher,
    accessTokenService,
    clock: () => NOW,
    refreshTokenTtlDays: 7,
  });
  return { authService, passwordHasher, refreshTokenRepository };
}

describe("AuthService", () => {
  it("compares the typed password even when the username does not exist", async () => {
    const { authService, passwordHasher } = createAuthService({ user: null });

    await expect(
      authService.login({ username: "ninguem", password: "senha-forte-123" }),
    ).rejects.toThrow(new UnauthorizedError("Usuário ou senha inválidos."));

    expect(passwordHasher.compare).toHaveBeenCalledExactlyOnceWith(
      "senha-forte-123",
      null,
    );
  });

  it("removes every refresh token of a user that no longer exists", async () => {
    const { authService, refreshTokenRepository } = createAuthService({
      user: null,
      storedRefreshToken: {
        id: "token-1",
        userId: "deleted-user",
        expiresAt: new Date("2026-11-26T12:00:00.000Z"),
      },
    });

    await expect(authService.refreshSession("refresh-token")).rejects.toThrow(
      UnauthorizedError,
    );

    expect(refreshTokenRepository.deleteAllOfUser).toHaveBeenCalledExactlyOnceWith(
      "deleted-user",
    );
    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
  });
});
