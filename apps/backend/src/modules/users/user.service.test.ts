import { describe, expect, it, vi } from "vitest";
import { ConflictError } from "../../shared/errors";
import type { AuthenticatedUser, User } from "./user";
import { UserHasAssessmentsError, type UserRepository } from "./user.repository";
import { UserService } from "./user.service";

const admin: AuthenticatedUser = {
  id: "admin-id",
  name: "Admin",
  username: "admin",
  role: "admin",
};

const student: User = {
  id: "student-id",
  name: "Pedro Costa",
  username: "pedro.costa",
  passwordHash: "hash",
  role: "student",
  status: "active",
  createdAt: new Date("2026-11-19T12:00:00.000Z"),
};

describe("UserService.deleteUser", () => {
  it("answers 409 when an assessment is recorded while the user is being deleted", async () => {
    const userRepository: UserRepository = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(async () => {
        throw new UserHasAssessmentsError(student.id);
      }),
      findById: vi.fn(async () => student),
      findByUsername: vi.fn(async () => null),
      listPaginated: vi.fn(),
      listOptions: vi.fn(),
      count: vi.fn(),
      findIdsWithAssessments: vi.fn(async () => new Set<string>()),
    };
    const userService = new UserService({
      userRepository,
      refreshTokenRepository: { deleteAllOfUser: vi.fn() },
      passwordHasher: { hash: vi.fn() },
      clock: () => new Date("2026-11-19T12:00:00.000Z"),
    });

    await expect(userService.deleteUser(admin, student.id)).rejects.toEqual(
      new ConflictError(
        "Este usuário tem avaliações vinculadas e não pode ser excluído. Inative o cadastro.",
      ),
    );
  });
});
