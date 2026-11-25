import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEMO_PASSWORDS, seedDemoData } from "../src/infra/database/demo-data";
import { AssessmentSchema } from "../src/infra/database/schemas/assessment.schema";
import { UserTokenSchema } from "../src/infra/database/schemas/user-token.schema";
import { UserSchema } from "../src/infra/database/schemas/user.schema";
import { BcryptPasswordHasher } from "../src/infra/security/bcrypt-password-hasher";
import { startOfMonth } from "../src/shared/clock";
import { createTestEnvironment, type TestEnvironment } from "./environment";

const passwordHasher = new BcryptPasswordHasher(4);

let environment: TestEnvironment;

beforeEach(async () => {
  environment = await createTestEnvironment();
});

afterEach(() => environment.closeDatabase());

async function countRows() {
  return {
    users: await environment.dataSource.getRepository(UserSchema).count(),
    assessments: await environment.dataSource.getRepository(AssessmentSchema).count(),
    tokens: await environment.dataSource.getRepository(UserTokenSchema).count(),
  };
}

describe("seedDemoData", () => {
  it("replaces every row with the demo gym, also when run twice", async () => {
    await environment.createUser("someone.else", "admin");
    await environment.login("someone.else");

    const seededCounts = await seedDemoData(
      environment.dataSource,
      passwordHasher,
      new Date(2026, 10, 19, 12),
    );
    await seedDemoData(
      environment.dataSource,
      passwordHasher,
      new Date(2026, 10, 19, 12),
    );

    expect(seededCounts).toEqual({ userCount: 14, assessmentCount: 54 });
    expect(await countRows()).toEqual({ users: 14, assessments: 54, tokens: 0 });
  });

  it("signs in with the demo logins and blocks the inactive people", async () => {
    await seedDemoData(
      environment.dataSource,
      passwordHasher,
      new Date(2026, 10, 19, 12),
    );

    await environment.login("admin", DEMO_PASSWORDS.admin);
    await environment.login("carla.mendes", DEMO_PASSWORDS.teacher);
    await environment.login("pedro.costa", DEMO_PASSWORDS.student);
    for (const [inactiveUsername, password] of [
      ["bruno.lima", DEMO_PASSWORDS.teacher],
      ["rodrigo.pereira", DEMO_PASSWORDS.student],
    ]) {
      await environment
        .httpRequest()
        .post("/api/auth/login")
        .send({ username: inactiveUsername, password })
        .expect(403);
    }
  });

  it.each([
    ["in the middle of a month", new Date("2026-11-19T15:00:00.000Z")],
    ["in the first minutes of a month", new Date("2026-11-01T03:05:00.000Z")],
  ])("reaches the month of the seed without passing it, %s", async (_case, now) => {
    await seedDemoData(environment.dataSource, passwordHasher, now);

    const latestAssessment = await environment.dataSource
      .getRepository(AssessmentSchema)
      .createQueryBuilder("a")
      .orderBy("a.createdAt", "DESC")
      .getOneOrFail();
    expect(latestAssessment.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(latestAssessment.createdAt.getTime()).toBeGreaterThanOrEqual(
      startOfMonth(now).getTime(),
    );
  });

  it("gives the dashboard something to show for each role", async () => {
    await seedDemoData(
      environment.dataSource,
      passwordHasher,
      new Date(2026, 10, 19, 12),
    );
    const adminToken = (await environment.login("admin", DEMO_PASSWORDS.admin))
      .accessToken;
    const carlaToken = (await environment.login("carla.mendes", DEMO_PASSWORDS.teacher))
      .accessToken;

    const adminSummary = await environment
      .httpRequestAs(adminToken)
      .get("/api/assessments/summary")
      .expect(200);
    const carlaSummary = await environment
      .httpRequestAs(carlaToken)
      .get("/api/assessments/summary")
      .expect(200);

    expect(adminSummary.body).toMatchObject({
      totalAssessments: 54,
      assessedStudents: 8,
      activeStudents: 9,
    });
    expect(adminSummary.body.assessmentsThisMonth).toBeGreaterThan(0);
    expect(carlaSummary.body).toMatchObject({
      totalAssessments: 26,
      assessedStudents: 4,
    });
  });
});
