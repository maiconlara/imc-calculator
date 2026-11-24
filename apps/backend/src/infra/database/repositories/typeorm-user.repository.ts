import type { DataSource } from "typeorm";
import type { User } from "../../../modules/users/user";
import type { UserRepository } from "../../../modules/users/user.repository";
import { UserSchema } from "../schemas/user.schema";

export class TypeormUserRepository implements UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get userOrmRepository() {
    return this.dataSource.getRepository(UserSchema);
  }

  findById(userId: string): Promise<User | null> {
    return this.userOrmRepository.findOneBy({ id: userId });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.userOrmRepository.findOneBy({ username: username.toLowerCase() });
  }
}
