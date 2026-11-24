export interface PasswordHasher {
  hash(password: string): Promise<string>;
  /**
   * Compares a password with a stored hash.
   *
   * @param password - Plain password typed by the user.
   * @param storedHash - Stored hash, or `null` when the user does not exist. The
   *                     comparison still runs against a dummy hash so both cases take
   *                     the same time.
   * @returns `true` only when the password matches a real hash.
   */
  compare(password: string, storedHash: string | null): Promise<boolean>;
}

export interface IssuedAccessToken {
  token: string;
  expiresAt: Date;
}

export interface VerifiedAccessToken {
  userId: string;
}

export interface AccessTokenService {
  issue(userId: string): IssuedAccessToken;
  /**
   * Checks the signature, issuer, audience and expiration of an access token.
   *
   * @param accessToken - Token sent by the client.
   * @returns The user the token was issued to, or `null` when it is not valid.
   */
  verify(accessToken: string): VerifiedAccessToken | null;
}

export interface StoredRefreshToken {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface NewRefreshToken {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface RefreshTokenRepository {
  save(newRefreshToken: NewRefreshToken): Promise<void>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  updateExpiration(refreshTokenId: string, expiresAt: Date): Promise<void>;
  deleteByHash(tokenHash: string): Promise<void>;
  deleteAllOfUser(userId: string): Promise<void>;
  deleteExpiredOfUser(userId: string, now: Date): Promise<void>;
}
