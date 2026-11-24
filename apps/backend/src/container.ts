import type { DataSource } from "typeorm";
import type { Env } from "./config/env";
import { checkDatabaseConnection } from "./infra/database/check-database-connection";
import { TypeormRefreshTokenRepository } from "./infra/database/repositories/typeorm-refresh-token.repository";
import { TypeormUserRepository } from "./infra/database/repositories/typeorm-user.repository";
import { BcryptPasswordHasher } from "./infra/security/bcrypt-password-hasher";
import { JsonwebtokenAccessTokenService } from "./infra/security/jsonwebtoken-access-token-service";
import { AuthService } from "./modules/auth/auth.service";
import { UserService } from "./modules/users/user.service";
import { systemClock, type Clock } from "./shared/clock";

export type ContainerSettings = Pick<
  Env,
  | "JWT_ACCESS_SECRET"
  | "JWT_ACCESS_TTL_MINUTES"
  | "REFRESH_TOKEN_TTL_DAYS"
  | "BCRYPT_ROUNDS"
>;

export interface AppServices {
  authService: AuthService;
  userService: UserService;
}

export interface Container {
  services: AppServices;
  checkDatabaseHealth: () => Promise<void>;
}

/**
 * Composition root: the only place that knows which implementation backs each port.
 *
 * @param dependencies - Open data source, validated configuration and an optional clock.
 * @returns The services consumed by the HTTP layer.
 */
export function createContainer(dependencies: {
  dataSource: DataSource;
  env: ContainerSettings;
  clock?: Clock;
}): Container {
  const { dataSource, env, clock = systemClock } = dependencies;

  const userRepository = new TypeormUserRepository(dataSource);
  const refreshTokenRepository = new TypeormRefreshTokenRepository(dataSource);
  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const accessTokenService = new JsonwebtokenAccessTokenService({
    secret: env.JWT_ACCESS_SECRET,
    ttlMinutes: env.JWT_ACCESS_TTL_MINUTES,
    clock,
  });

  return {
    services: {
      authService: new AuthService({
        userRepository,
        refreshTokenRepository,
        passwordHasher,
        accessTokenService,
        clock,
        refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
      }),
      userService: new UserService({
        userRepository,
        refreshTokenRepository,
        passwordHasher,
        clock,
      }),
    },
    checkDatabaseHealth: () => checkDatabaseConnection(dataSource),
  };
}
