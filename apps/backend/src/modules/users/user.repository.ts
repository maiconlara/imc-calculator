import type { User } from "./user";

export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}
