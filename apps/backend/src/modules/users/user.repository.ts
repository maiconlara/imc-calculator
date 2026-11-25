import type { Pagination, Role, UserOption, UserStatus } from "@imc-calculator/shared";
import type { NewUser, User, UserChanges } from "./user";

export interface UserFilters {
  search?: string;
  role?: Role;
  status?: UserStatus;
  onlyWithAssessments?: boolean;
  assessedByTeacherId?: string;
}

/**
 * Thrown by `create` and `update` when another user already has the username,
 * including when two requests save the same username at the same time.
 */
export class UsernameTakenError extends Error {
  constructor(readonly username: string) {
    super(`The username "${username}" is already taken`);
    this.name = "UsernameTakenError";
  }
}

/**
 * Thrown by `delete` when an assessment still references the user, as the student or
 * as the assessor, including one recorded while the deletion was running.
 */
export class UserHasAssessmentsError extends Error {
  constructor(readonly userId: string) {
    super(`The user ${userId} has assessments`);
    this.name = "UserHasAssessmentsError";
  }
}

export interface UserRepository {
  create(newUser: NewUser): Promise<User>;
  update(userId: string, userChanges: UserChanges): Promise<User>;
  delete(userId: string): Promise<void>;
  findById(userId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  listPaginated(
    userFilters: UserFilters,
    pagination: Pagination,
  ): Promise<{ users: User[]; total: number }>;
  listOptions(userFilters: UserFilters & { role: Role }): Promise<UserOption[]>;
  count(userFilters: UserFilters): Promise<number>;
  /**
   * Finds which of the given users have assessments, as the student or as the assessor.
   *
   * @param userIds - Users to check.
   * @returns The ids, among those given, that have at least one assessment.
   */
  findIdsWithAssessments(userIds: string[]): Promise<Set<string>>;
}
