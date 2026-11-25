import { randomUUID } from "node:crypto";
import type { DataSource } from "typeorm";
import { assessBmi, roundTo, type Role, type UserStatus } from "@imc-calculator/shared";
import type { Assessment } from "../../modules/assessments/assessment";
import type { PasswordHasher } from "../../modules/auth/ports";
import type { User } from "../../modules/users/user";
import { AssessmentSchema } from "./schemas/assessment.schema";
import { UserTokenSchema } from "./schemas/user-token.schema";
import { UserSchema } from "./schemas/user.schema";

interface DemoPerson {
  name: string;
  username: string;
  role: Role;
  status: UserStatus;
}

interface DemoAssessmentHistory {
  studentUsername: string;
  teacherUsername: string;
  height: number;
  initialWeight: number;
  monthlyWeightChange: number;
  assessmentCount: number;
}

export const DEMO_PASSWORDS: Record<Role, string> = {
  admin: "admin123",
  teacher: "prof1234",
  student: "aluno123",
};

export const DEMO_PEOPLE: readonly DemoPerson[] = [
  {
    name: "Administrador da Academia",
    username: "admin",
    role: "admin",
    status: "active",
  },
  { name: "Carla Mendes", username: "carla.mendes", role: "teacher", status: "active" },
  { name: "Rafael Souza", username: "rafael.souza", role: "teacher", status: "active" },
  { name: "Bruno Lima", username: "bruno.lima", role: "teacher", status: "inactive" },
  { name: "Pedro Costa", username: "pedro.costa", role: "student", status: "active" },
  { name: "Ana Oliveira", username: "ana.oliveira", role: "student", status: "active" },
  {
    name: "Lucas Ferreira",
    username: "lucas.ferreira",
    role: "student",
    status: "active",
  },
  { name: "Juliana Rocha", username: "juliana.rocha", role: "student", status: "active" },
  { name: "Marcos Alves", username: "marcos.alves", role: "student", status: "active" },
  {
    name: "Beatriz Santos",
    username: "beatriz.santos",
    role: "student",
    status: "active",
  },
  {
    name: "Gabriel Martins",
    username: "gabriel.martins",
    role: "student",
    status: "active",
  },
  { name: "Fernanda Lima", username: "fernanda.lima", role: "student", status: "active" },
  {
    name: "Rodrigo Pereira",
    username: "rodrigo.pereira",
    role: "student",
    status: "inactive",
  },
  { name: "Camila Duarte", username: "camila.duarte", role: "student", status: "active" },
];

const DEMO_ASSESSMENT_HISTORIES: readonly DemoAssessmentHistory[] = [
  {
    studentUsername: "pedro.costa",
    teacherUsername: "carla.mendes",
    height: 1.75,
    initialWeight: 94,
    monthlyWeightChange: -1.7,
    assessmentCount: 8,
  },
  {
    studentUsername: "ana.oliveira",
    teacherUsername: "carla.mendes",
    height: 1.62,
    initialWeight: 57.5,
    monthlyWeightChange: 0.3,
    assessmentCount: 6,
  },
  {
    studentUsername: "lucas.ferreira",
    teacherUsername: "rafael.souza",
    height: 1.8,
    initialWeight: 104,
    monthlyWeightChange: -2.1,
    assessmentCount: 7,
  },
  {
    studentUsername: "juliana.rocha",
    teacherUsername: "rafael.souza",
    height: 1.68,
    initialWeight: 49.5,
    monthlyWeightChange: 0.8,
    assessmentCount: 6,
  },
  {
    studentUsername: "marcos.alves",
    teacherUsername: "carla.mendes",
    height: 1.7,
    initialWeight: 118,
    monthlyWeightChange: -1.9,
    assessmentCount: 8,
  },
  {
    studentUsername: "beatriz.santos",
    teacherUsername: "rafael.souza",
    height: 1.58,
    initialWeight: 64.5,
    monthlyWeightChange: -0.6,
    assessmentCount: 5,
  },
  {
    studentUsername: "gabriel.martins",
    teacherUsername: "carla.mendes",
    height: 1.85,
    initialWeight: 79,
    monthlyWeightChange: 0.4,
    assessmentCount: 4,
  },
  {
    studentUsername: "fernanda.lima",
    teacherUsername: "rafael.souza",
    height: 1.65,
    initialWeight: 127,
    monthlyWeightChange: -2.4,
    assessmentCount: 7,
  },
  {
    studentUsername: "rodrigo.pereira",
    teacherUsername: "bruno.lima",
    height: 1.77,
    initialWeight: 86,
    monthlyWeightChange: -0.4,
    assessmentCount: 3,
  },
];

/**
 * Spreads the monthly assessments over different days and hours. A date after `now`
 * becomes `now`, so the history always reaches the current month and never passes it.
 *
 * @param now - Reference date of the seed.
 * @param monthsAgo - How many months before `now` the assessment falls.
 * @param dayAndHourSeed - Number that varies the day and the hour.
 * @returns The assessment date, in the server time zone.
 */
function buildAssessmentDate(now: Date, monthsAgo: number, dayAndHourSeed: number): Date {
  const assessmentDate = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo,
    3 + ((dayAndHourSeed * 7) % 20),
    8 + (dayAndHourSeed % 10),
    15,
  );
  return assessmentDate.getTime() > now.getTime()
    ? new Date(now.getTime())
    : assessmentDate;
}

function buildDemoAssessments(
  now: Date,
  getUserIdByUsername: (username: string) => string,
): Assessment[] {
  return DEMO_ASSESSMENT_HISTORIES.flatMap((assessmentHistory, historyIndex) =>
    Array.from({ length: assessmentHistory.assessmentCount }, (_, assessmentIndex) => {
      const weightOscillation =
        Math.sin((historyIndex + 1) * (assessmentIndex + 1)) * 0.6;
      const weight = roundTo(
        assessmentHistory.initialWeight +
          assessmentHistory.monthlyWeightChange * assessmentIndex +
          weightOscillation,
        1,
      );
      return {
        id: randomUUID(),
        height: assessmentHistory.height,
        weight,
        ...assessBmi(weight, assessmentHistory.height),
        studentId: getUserIdByUsername(assessmentHistory.studentUsername),
        assessorId: getUserIdByUsername(assessmentHistory.teacherUsername),
        createdAt: buildAssessmentDate(
          now,
          assessmentHistory.assessmentCount - 1 - assessmentIndex,
          historyIndex + assessmentIndex,
        ),
      };
    }),
  );
}

/**
 * Replaces every row with a demo gym: one administrator, three teachers (one
 * inactive), ten students (one inactive, one without assessments) and their monthly
 * assessments up to `now`.
 *
 * @param dataSource - Initialized data source with the migrations applied.
 * @param passwordHasher - Hashes the demo passwords.
 * @param now - Reference date of the assessment history.
 * @returns How many users and assessments were created.
 */
export async function seedDemoData(
  dataSource: DataSource,
  passwordHasher: Pick<PasswordHasher, "hash">,
  now: Date,
): Promise<{ userCount: number; assessmentCount: number }> {
  const passwordHashByRole: Record<Role, string> = {
    admin: await passwordHasher.hash(DEMO_PASSWORDS.admin),
    teacher: await passwordHasher.hash(DEMO_PASSWORDS.teacher),
    student: await passwordHasher.hash(DEMO_PASSWORDS.student),
  };

  const demoUsers: User[] = DEMO_PEOPLE.map((demoPerson, personIndex) => ({
    id: randomUUID(),
    ...demoPerson,
    passwordHash: passwordHashByRole[demoPerson.role],
    createdAt: new Date(now.getFullYear(), now.getMonth() - 9, 1 + personIndex, 9),
  }));
  const userIdByUsername = new Map(demoUsers.map((user) => [user.username, user.id]));
  const demoAssessments = buildDemoAssessments(now, (username) => {
    const userId = userIdByUsername.get(username);
    if (!userId) throw new Error(`Demo user ${username} does not exist`);
    return userId;
  });

  await dataSource.transaction(async (transactionManager) => {
    await transactionManager.clear(AssessmentSchema);
    await transactionManager.clear(UserTokenSchema);
    await transactionManager.clear(UserSchema);
    await transactionManager.insert(UserSchema, demoUsers);
    await transactionManager.insert(AssessmentSchema, demoAssessments);
  });

  return { userCount: demoUsers.length, assessmentCount: demoAssessments.length };
}
