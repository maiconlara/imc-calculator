import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TypeormUserRepository } from "../src/infra/database/repositories/typeorm-user.repository";
import type { User } from "../src/modules/users/user";
import {
  UserHasAssessmentsError,
  UsernameTakenError,
} from "../src/modules/users/user.repository";
import { createTestEnvironment, type TestEnvironment } from "./environment";

let environment: TestEnvironment;
let userRepository: TypeormUserRepository;
let teacher: User;
let student: User;

beforeEach(async () => {
  environment = await createTestEnvironment();
  userRepository = new TypeormUserRepository(environment.dataSource);
  teacher = await environment.createUser("carla.mendes", "teacher");
  student = await environment.createUser("pedro.costa", "student");
});

afterEach(() => environment.closeDatabase());

describe("TypeormUserRepository", () => {
  it("reports a username taken by another user on create and on update", async () => {
    await expect(
      userRepository.create({
        name: "Pedro Outro",
        username: "pedro.costa",
        passwordHash: "hash",
        role: "student",
        status: "active",
        createdAt: new Date("2026-11-19T12:00:00.000Z"),
      }),
    ).rejects.toEqual(new UsernameTakenError("pedro.costa"));

    await expect(
      userRepository.update(teacher.id, { username: "pedro.costa" }),
    ).rejects.toEqual(new UsernameTakenError("pedro.costa"));
  });

  it("refuses to delete a user an assessment references, keeping the user and their sessions", async () => {
    await environment.recordAssessment({
      student,
      assessor: teacher,
      weight: 80,
      height: 1.8,
      createdAt: "2026-11-01T10:00:00.000Z",
    });
    const studentSession = await environment.login("pedro.costa");

    await expect(userRepository.delete(student.id)).rejects.toEqual(
      new UserHasAssessmentsError(student.id),
    );
    await expect(userRepository.delete(teacher.id)).rejects.toEqual(
      new UserHasAssessmentsError(teacher.id),
    );

    expect(await userRepository.findById(student.id)).not.toBeNull();
    await environment
      .httpRequest()
      .post("/api/auth/refresh")
      .send({ refreshToken: studentSession.refreshToken })
      .expect(200);
  });
});
