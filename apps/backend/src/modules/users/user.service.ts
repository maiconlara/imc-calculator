import type {
  CreateUserData,
  ListUsersQuery,
  Paginated,
  PublicUser,
  Role,
  UpdateUserData,
  UserOption,
  UserOptionsQuery,
  UserStatus,
} from "@imc-calculator/shared";
import type { Clock } from "../../shared/clock";
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors";
import type { PasswordHasher, RefreshTokenRepository } from "../auth/ports";
import type { AuthenticatedUser, User, UserChanges } from "./user";
import { toPublicUser } from "./user.mapper";
import {
  UserHasAssessmentsError,
  UsernameTakenError,
  type UserRepository,
} from "./user.repository";

const TEACHER_MANAGES_ONLY_STUDENTS_MESSAGE = "Professores só podem gerenciar alunos.";
const USER_WITH_ASSESSMENTS_MESSAGE =
  "Este usuário tem avaliações vinculadas e não pode ser excluído. Inative o cadastro.";

export interface UserServiceDependencies {
  userRepository: UserRepository;
  refreshTokenRepository: Pick<RefreshTokenRepository, "deleteAllOfUser">;
  passwordHasher: Pick<PasswordHasher, "hash">;
  clock: Clock;
}

export class UserService {
  constructor(private readonly dependencies: UserServiceDependencies) {}

  async listUsers(
    actingUser: AuthenticatedUser,
    listUsersQuery: ListUsersQuery,
  ): Promise<Paginated<PublicUser>> {
    this.ensureCanManageRole(actingUser, listUsersQuery.role ?? "student");
    const visibleRole = actingUser.role === "teacher" ? "student" : listUsersQuery.role;
    const { users, total } = await this.dependencies.userRepository.listPaginated(
      { search: listUsersQuery.search, role: visibleRole, status: listUsersQuery.status },
      listUsersQuery,
    );
    const userIdsWithAssessments =
      await this.dependencies.userRepository.findIdsWithAssessments(
        users.map((user) => user.id),
      );
    return {
      items: users.map((user) => toPublicUser(user, userIdsWithAssessments.has(user.id))),
      total,
      page: listUsersQuery.page,
      pageSize: listUsersQuery.pageSize,
    };
  }

  /**
   * Lists users for a select field. With `onlyAssessed`, a teacher gets only their
   * students, and an administrator gets everyone of the role who has assessments.
   *
   * @param actingUser - Signed in user.
   * @param userOptionsQuery - Role, optional status and `onlyAssessed`.
   * @returns The id, name and status of each user, ordered by name.
   */
  async listUserOptions(
    actingUser: AuthenticatedUser,
    userOptionsQuery: UserOptionsQuery,
  ): Promise<UserOption[]> {
    this.ensureCanManageRole(actingUser, userOptionsQuery.role);
    return this.dependencies.userRepository.listOptions({
      role: userOptionsQuery.role,
      status: userOptionsQuery.status,
      onlyWithAssessments: userOptionsQuery.onlyAssessed,
      assessedByTeacherId:
        userOptionsQuery.onlyAssessed && actingUser.role === "teacher"
          ? actingUser.id
          : undefined,
    });
  }

  async getUser(actingUser: AuthenticatedUser, userId: string): Promise<PublicUser> {
    const user = await this.findUserOrThrow(userId);
    this.ensureCanManageRole(actingUser, user.role);
    return this.toPublicUserWithAssessmentFlag(user);
  }

  async createUser(
    actingUser: AuthenticatedUser,
    newUserData: CreateUserData,
  ): Promise<PublicUser> {
    this.ensureCanManageRole(actingUser, newUserData.role);

    const passwordHash = await this.dependencies.passwordHasher.hash(
      newUserData.password,
    );
    const createdUser = await this.saveWithAvailableUsername(newUserData.username, () =>
      this.dependencies.userRepository.create({
        name: newUserData.name,
        username: newUserData.username,
        passwordHash,
        role: newUserData.role,
        status: newUserData.status,
        createdAt: this.dependencies.clock(),
      }),
    );
    return toPublicUser(createdUser, false);
  }

  async updateUser(
    actingUser: AuthenticatedUser,
    userId: string,
    requestedChanges: UpdateUserData,
  ): Promise<PublicUser> {
    const targetUser = await this.findUserOrThrow(userId);
    this.ensureCanManageRole(actingUser, targetUser.role);
    this.ensureCanManageRole(actingUser, requestedChanges.role);

    if (requestedChanges.role !== targetUser.role) {
      if (targetUser.id === actingUser.id) {
        throw new BusinessRuleError("Você não pode alterar o próprio perfil.");
      }
      const userIdsWithAssessments =
        await this.dependencies.userRepository.findIdsWithAssessments([targetUser.id]);
      if (userIdsWithAssessments.has(targetUser.id)) {
        throw new BusinessRuleError(
          "Não é possível mudar o perfil de um usuário que já tem avaliações vinculadas.",
        );
      }
    }

    const userChanges: UserChanges = {
      name: requestedChanges.name,
      username: requestedChanges.username,
      role: requestedChanges.role,
    };
    if (requestedChanges.password) {
      userChanges.passwordHash = await this.dependencies.passwordHasher.hash(
        requestedChanges.password,
      );
    }

    const updatedUser = await this.saveWithAvailableUsername(
      requestedChanges.username,
      () => this.dependencies.userRepository.update(targetUser.id, userChanges),
    );
    if (requestedChanges.password && targetUser.id !== actingUser.id) {
      await this.dependencies.refreshTokenRepository.deleteAllOfUser(targetUser.id);
    }
    return this.toPublicUserWithAssessmentFlag(updatedUser);
  }

  async changeUserStatus(
    actingUser: AuthenticatedUser,
    userId: string,
    newStatus: UserStatus,
  ): Promise<PublicUser> {
    const targetUser = await this.findUserOrThrow(userId);
    this.ensureCanManageRole(actingUser, targetUser.role);
    if (targetUser.id === actingUser.id) {
      throw new BusinessRuleError("Você não pode alterar a situação da própria conta.");
    }

    const updatedUser = await this.dependencies.userRepository.update(targetUser.id, {
      status: newStatus,
    });
    if (newStatus === "inactive") {
      await this.dependencies.refreshTokenRepository.deleteAllOfUser(targetUser.id);
    }
    return this.toPublicUserWithAssessmentFlag(updatedUser);
  }

  async deleteUser(actingUser: AuthenticatedUser, userId: string): Promise<void> {
    if (actingUser.role !== "admin") throw new ForbiddenError();

    const targetUser = await this.findUserOrThrow(userId);
    if (targetUser.id === actingUser.id) {
      throw new BusinessRuleError("Você não pode excluir a própria conta.");
    }
    const userIdsWithAssessments =
      await this.dependencies.userRepository.findIdsWithAssessments([targetUser.id]);
    if (userIdsWithAssessments.has(targetUser.id)) {
      throw new ConflictError(USER_WITH_ASSESSMENTS_MESSAGE);
    }
    try {
      await this.dependencies.userRepository.delete(targetUser.id);
    } catch (deleteError) {
      if (deleteError instanceof UserHasAssessmentsError) {
        throw new ConflictError(USER_WITH_ASSESSMENTS_MESSAGE);
      }
      throw deleteError;
    }
  }

  private async findUserOrThrow(userId: string): Promise<User> {
    const user = await this.dependencies.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado.");
    return user;
  }

  private async toPublicUserWithAssessmentFlag(user: User): Promise<PublicUser> {
    const userIdsWithAssessments =
      await this.dependencies.userRepository.findIdsWithAssessments([user.id]);
    return toPublicUser(user, userIdsWithAssessments.has(user.id));
  }

  private async saveWithAvailableUsername(
    username: string,
    saveUser: () => Promise<User>,
  ): Promise<User> {
    try {
      return await saveUser();
    } catch (saveError) {
      if (saveError instanceof UsernameTakenError) {
        throw new ConflictError(`O usuário "${username}" já está em uso.`);
      }
      throw saveError;
    }
  }

  private ensureCanManageRole(actingUser: AuthenticatedUser, targetRole: Role): void {
    if (actingUser.role === "admin") return;
    if (actingUser.role === "teacher" && targetRole === "student") return;
    throw new ForbiddenError(
      actingUser.role === "teacher" ? TEACHER_MANAGES_ONLY_STUDENTS_MESSAGE : undefined,
    );
  }
}
