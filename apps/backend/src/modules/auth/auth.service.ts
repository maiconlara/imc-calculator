import type { LoginData, LoginResponse } from "@imc-calculator/shared";
import type { Clock } from "../../shared/clock";
import { ForbiddenError, UnauthorizedError } from "../../shared/errors";
import type { AuthenticatedUser, User } from "../users/user";
import { toSessionUser } from "../users/user.mapper";
import type { UserRepository } from "../users/user.repository";
import type { AccessTokenService, PasswordHasher, RefreshTokenRepository } from "./ports";
import { generateRefreshToken, hashRefreshToken } from "./refresh-token";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_REUSE_WINDOW_MS = 30_000;

export interface AuthServiceDependencies {
  userRepository: Pick<UserRepository, "findById" | "findByUsername">;
  refreshTokenRepository: RefreshTokenRepository;
  passwordHasher: Pick<PasswordHasher, "compare">;
  accessTokenService: AccessTokenService;
  clock: Clock;
  refreshTokenTtlDays: number;
}

export class AuthService {
  constructor(private readonly dependencies: AuthServiceDependencies) {}

  async login(credentials: LoginData): Promise<LoginResponse> {
    const user = await this.dependencies.userRepository.findByUsername(
      credentials.username,
    );
    const passwordMatches = await this.dependencies.passwordHasher.compare(
      credentials.password,
      user?.passwordHash ?? null,
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedError("Usuário ou senha inválidos.");
    }
    if (user.status !== "active") {
      throw new ForbiddenError("Usuário inativo. Procure a administração da academia.");
    }
    await this.dependencies.refreshTokenRepository.deleteExpiredOfUser(
      user.id,
      this.dependencies.clock(),
    );
    return this.openSession(user);
  }

  /**
   * Rotates a refresh token. The old token stays valid for a short window so
   * parallel requests holding it do not end the session.
   *
   * @param refreshToken - Token received on login or on the previous rotation.
   * @returns A new token pair and the session user.
   */
  async refreshSession(refreshToken: string): Promise<LoginResponse> {
    const now = this.dependencies.clock();
    const storedRefreshToken = await this.dependencies.refreshTokenRepository.findByHash(
      hashRefreshToken(refreshToken),
    );
    if (!storedRefreshToken || storedRefreshToken.expiresAt.getTime() <= now.getTime()) {
      throw new UnauthorizedError();
    }

    const user = await this.dependencies.userRepository.findById(
      storedRefreshToken.userId,
    );
    if (!user || user.status !== "active") {
      await this.dependencies.refreshTokenRepository.deleteAllOfUser(
        storedRefreshToken.userId,
      );
      throw new UnauthorizedError();
    }

    const reuseWindowEnd = new Date(now.getTime() + REFRESH_REUSE_WINDOW_MS);
    if (storedRefreshToken.expiresAt.getTime() > reuseWindowEnd.getTime()) {
      await this.dependencies.refreshTokenRepository.updateExpiration(
        storedRefreshToken.id,
        reuseWindowEnd,
      );
    }
    return this.openSession(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.dependencies.refreshTokenRepository.deleteByHash(
      hashRefreshToken(refreshToken),
    );
  }

  /**
   * Resolves the user of an access token, reading the role and status from the
   * database so an inactivated user loses access on the next request.
   *
   * @param accessToken - Bearer token sent by the client.
   * @returns The authenticated user.
   */
  async identifyUserByAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const verifiedAccessToken = this.dependencies.accessTokenService.verify(accessToken);
    if (!verifiedAccessToken) throw new UnauthorizedError();

    const user = await this.dependencies.userRepository.findById(
      verifiedAccessToken.userId,
    );
    if (!user || user.status !== "active") throw new UnauthorizedError();

    return toSessionUser(user);
  }

  private async openSession(user: User): Promise<LoginResponse> {
    const now = this.dependencies.clock();
    const issuedAccessToken = this.dependencies.accessTokenService.issue(user.id);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiresAt = new Date(
      now.getTime() + this.dependencies.refreshTokenTtlDays * ONE_DAY_MS,
    );

    await this.dependencies.refreshTokenRepository.save({
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
      createdAt: now,
    });

    return {
      accessToken: issuedAccessToken.token,
      accessTokenExpiresAt: issuedAccessToken.expiresAt.toISOString(),
      refreshToken,
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      user: toSessionUser(user),
    };
  }
}
