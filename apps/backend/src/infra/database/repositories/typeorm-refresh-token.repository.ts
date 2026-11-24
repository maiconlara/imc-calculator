import { randomUUID } from "node:crypto";
import { LessThanOrEqual, type DataSource } from "typeorm";
import type {
  NewRefreshToken,
  RefreshTokenRepository,
  StoredRefreshToken,
} from "../../../modules/auth/ports";
import { UserTokenSchema } from "../schemas/user-token.schema";

export class TypeormRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get userTokenOrmRepository() {
    return this.dataSource.getRepository(UserTokenSchema);
  }

  async save(newRefreshToken: NewRefreshToken): Promise<void> {
    await this.userTokenOrmRepository.insert({
      id: randomUUID(),
      refreshTokenHash: newRefreshToken.tokenHash,
      userId: newRefreshToken.userId,
      expiresAt: newRefreshToken.expiresAt,
      createdAt: newRefreshToken.createdAt,
    });
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const userTokenRecord = await this.userTokenOrmRepository.findOneBy({
      refreshTokenHash: tokenHash,
    });
    if (!userTokenRecord) return null;
    return {
      id: userTokenRecord.id,
      userId: userTokenRecord.userId,
      expiresAt: userTokenRecord.expiresAt,
    };
  }

  async updateExpiration(refreshTokenId: string, expiresAt: Date): Promise<void> {
    await this.userTokenOrmRepository.update({ id: refreshTokenId }, { expiresAt });
  }

  async deleteByHash(tokenHash: string): Promise<void> {
    await this.userTokenOrmRepository.delete({ refreshTokenHash: tokenHash });
  }

  async deleteAllOfUser(userId: string): Promise<void> {
    await this.userTokenOrmRepository.delete({ userId });
  }

  async deleteExpiredOfUser(userId: string, now: Date): Promise<void> {
    await this.userTokenOrmRepository.delete({
      userId,
      expiresAt: LessThanOrEqual(now),
    });
  }
}
