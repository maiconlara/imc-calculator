import { randomUUID } from "node:crypto";
import { QueryFailedError, type DataSource, type SelectQueryBuilder } from "typeorm";
import type { Pagination, Role, UserOption } from "@imc-calculator/shared";
import type { NewUser, User, UserChanges } from "../../../modules/users/user";
import {
  UserHasAssessmentsError,
  UsernameTakenError,
  type UserFilters,
  type UserRepository,
} from "../../../modules/users/user.repository";
import { roleColumnValues, userStatusColumnValues } from "../column-values";
import { FOLD_TEXT_SQL_FUNCTION, foldText } from "../fold-text";
import { AssessmentSchema } from "../schemas/assessment.schema";
import { UserTokenSchema } from "../schemas/user-token.schema";
import { UserSchema } from "../schemas/user.schema";

const USERNAME_UNIQUE_VIOLATION = "UNIQUE constraint failed: usuario.usuario";
const FOREIGN_KEY_VIOLATION = "FOREIGN KEY constraint failed";
const FOLDED_NAME = `${FOLD_TEXT_SQL_FUNCTION}(u.name)`;
const FOLDED_USERNAME = `${FOLD_TEXT_SQL_FUNCTION}(u.username)`;

function escapeLikePattern(searchTerm: string): string {
  return searchTerm.replace(/[\\%_]/g, (specialCharacter) => `\\${specialCharacter}`);
}

function isQueryFailure(error: unknown, sqliteMessage: string): boolean {
  return error instanceof QueryFailedError && error.message.includes(sqliteMessage);
}

export class TypeormUserRepository implements UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get userOrmRepository() {
    return this.dataSource.getRepository(UserSchema);
  }

  async create(newUser: NewUser): Promise<User> {
    const createdUser: User = { id: randomUUID(), ...newUser };
    await this.saveWithUniqueUsername(newUser.username, () =>
      this.userOrmRepository.insert(createdUser),
    );
    return createdUser;
  }

  async update(userId: string, userChanges: UserChanges): Promise<User> {
    await this.saveWithUniqueUsername(userChanges.username, () =>
      this.userOrmRepository.update({ id: userId }, userChanges),
    );
    const updatedUser = await this.findById(userId);
    if (!updatedUser) throw new Error(`User ${userId} disappeared during the update`);
    return updatedUser;
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.dataSource.transaction(async (transactionManager) => {
        await transactionManager.delete(UserTokenSchema, { userId });
        await transactionManager.delete(UserSchema, { id: userId });
      });
    } catch (deleteError) {
      if (isQueryFailure(deleteError, FOREIGN_KEY_VIOLATION)) {
        throw new UserHasAssessmentsError(userId);
      }
      throw deleteError;
    }
  }

  findById(userId: string): Promise<User | null> {
    return this.userOrmRepository.findOneBy({ id: userId });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.userOrmRepository.findOneBy({ username: username.toLowerCase() });
  }

  async listPaginated(
    userFilters: UserFilters,
    { page, pageSize }: Pagination,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.buildFilteredQuery(userFilters)
      .orderBy(FOLDED_NAME, "ASC")
      .addOrderBy("u.name", "ASC")
      .addOrderBy("u.id", "ASC")
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getManyAndCount();
    return { users, total };
  }

  async listOptions(userFilters: UserFilters & { role: Role }): Promise<UserOption[]> {
    const users = await this.buildFilteredQuery(userFilters)
      .select(["u.id", "u.name", "u.status"])
      .orderBy(FOLDED_NAME, "ASC")
      .addOrderBy("u.name", "ASC")
      .addOrderBy("u.id", "ASC")
      .getMany();
    return users.map(({ id, name, status }) => ({ id, name, status }));
  }

  count(userFilters: UserFilters): Promise<number> {
    return this.buildFilteredQuery(userFilters).getCount();
  }

  async findIdsWithAssessments(userIds: string[]): Promise<Set<string>> {
    const userIdsWithAssessments = new Set<string>();
    if (userIds.length === 0) return userIdsWithAssessments;

    const assessmentParticipants = await this.dataSource
      .getRepository(AssessmentSchema)
      .createQueryBuilder("a")
      .select("a.studentId", "studentId")
      .addSelect("a.assessorId", "assessorId")
      .distinct(true)
      .where("a.studentId IN (:...userIds) OR a.assessorId IN (:...userIds)", {
        userIds,
      })
      .getRawMany<{ studentId: string; assessorId: string }>();

    const requestedUserIds = new Set(userIds);
    for (const { studentId, assessorId } of assessmentParticipants) {
      if (requestedUserIds.has(studentId)) userIdsWithAssessments.add(studentId);
      if (requestedUserIds.has(assessorId)) userIdsWithAssessments.add(assessorId);
    }
    return userIdsWithAssessments;
  }

  private async saveWithUniqueUsername(
    username: string | undefined,
    saveUser: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await saveUser();
    } catch (saveError) {
      if (
        username !== undefined &&
        isQueryFailure(saveError, USERNAME_UNIQUE_VIOLATION)
      ) {
        throw new UsernameTakenError(username);
      }
      throw saveError;
    }
  }

  private buildFilteredQuery(userFilters: UserFilters): SelectQueryBuilder<User> {
    const filteredQuery = this.userOrmRepository.createQueryBuilder("u");
    if (userFilters.role) {
      filteredQuery.andWhere("u.role = :role", {
        role: roleColumnValues.toColumnValue(userFilters.role),
      });
    }
    if (userFilters.status) {
      filteredQuery.andWhere("u.status = :status", {
        status: userStatusColumnValues.toColumnValue(userFilters.status),
      });
    }
    if (userFilters.search) {
      filteredQuery.andWhere(
        `(${FOLDED_NAME} LIKE :likePattern ESCAPE '\\' OR ${FOLDED_USERNAME} LIKE :likePattern ESCAPE '\\')`,
        { likePattern: `%${escapeLikePattern(foldText(userFilters.search))}%` },
      );
    }
    if (userFilters.assessedByTeacherId) {
      filteredQuery.andWhere(
        (query) =>
          `u.id IN ${query
            .subQuery()
            .select("teacherAssessment.studentId")
            .from(AssessmentSchema, "teacherAssessment")
            .where("teacherAssessment.assessorId = :assessedByTeacherId")
            .getQuery()}`,
        { assessedByTeacherId: userFilters.assessedByTeacherId },
      );
    } else if (userFilters.onlyWithAssessments) {
      filteredQuery.andWhere((query) => {
        const assessedStudentIds = query
          .subQuery()
          .select("studentAssessment.studentId")
          .from(AssessmentSchema, "studentAssessment")
          .getQuery();
        const assessorIds = query
          .subQuery()
          .select("assessorAssessment.assessorId")
          .from(AssessmentSchema, "assessorAssessment")
          .getQuery();
        return `(u.id IN ${assessedStudentIds} OR u.id IN ${assessorIds})`;
      });
    }
    return filteredQuery;
  }
}
