import { ROLES, type Role } from "@imc-calculator/shared";
import type { PanelScreen } from "./routes";

export const PANEL_ACTIONS = [
  "manageUsers",
  "deleteUsers",
  "recordAssessments",
  "editAssessments",
  "deleteAssessments",
  "filterAssessmentsByStudent",
  "filterAssessmentsByTeacher",
  "seeGymNumbers",
] as const;

export type PanelAction = (typeof PANEL_ACTIONS)[number];

const SCREEN_ROLES: Record<PanelScreen, readonly Role[]> = {
  dashboard: ROLES,
  assessments: ROLES,
  users: ["admin", "teacher"],
};

const ACTION_ROLES: Record<PanelAction, readonly Role[]> = {
  manageUsers: ["admin", "teacher"],
  deleteUsers: ["admin"],
  recordAssessments: ["admin", "teacher"],
  editAssessments: ["admin", "teacher"],
  deleteAssessments: ["admin"],
  filterAssessmentsByStudent: ["admin", "teacher"],
  filterAssessmentsByTeacher: ["admin"],
  seeGymNumbers: ["admin", "teacher"],
};

const MANAGEABLE_ROLES: Record<Role, readonly Role[]> = {
  admin: ROLES,
  teacher: ["student"],
  student: [],
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Acesso total: cadastra usuários e gerencia todas as avaliações.",
  teacher: "Cadastra e edita alunos e registra as avaliações deles.",
  student: "Consulta apenas as próprias avaliações.",
};

/**
 * The single place that says which role sees each screen and each action. The menu,
 * the page guard and the buttons read from here; the API enforces the same rules.
 */
export const permissions = {
  canOpenScreen: (role: Role, screen: PanelScreen) => SCREEN_ROLES[screen].includes(role),
  canPerform: (role: Role, action: PanelAction) => ACTION_ROLES[action].includes(role),
  getManageableRoles: (role: Role): readonly Role[] => MANAGEABLE_ROLES[role],
  canChooseUserRole: (role: Role) => MANAGEABLE_ROLES[role].length > 1,
};
