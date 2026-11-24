import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../modules/auth/ports";

export class BcryptPasswordHasher implements PasswordHasher {
  private dummyHash: Promise<string> | null = null;

  constructor(private readonly saltRounds: number) {}

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, storedHash: string | null): Promise<boolean> {
    if (storedHash) return bcrypt.compare(password, storedHash);
    this.dummyHash ??= bcrypt.hash(randomUUID(), this.saltRounds);
    await bcrypt.compare(password, await this.dummyHash);
    return false;
  }
}
