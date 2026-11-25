import { ROLES, type Role } from "@imc-calculator/shared";
import type { PanelScreen } from "./routes";

const SCREEN_ROLES: Record<PanelScreen, readonly Role[]> = {
  dashboard: ROLES,
  assessments: ROLES,
  users: ["admin", "teacher"],
};

/**
 * The single place that says which role sees each screen and each action. The menu,
 * the page guard and the buttons read from here; the API enforces the same rules.
 */
export const permissions = {
  canOpenScreen: (role: Role, screen: PanelScreen) => SCREEN_ROLES[screen].includes(role),
};
