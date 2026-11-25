import type { Role } from "@imc-calculator/shared";
import type { PanelScreen } from "./routes";

const SCREEN_TITLES: Record<PanelScreen, Record<Role, string>> = {
  dashboard: { admin: "Dashboard", teacher: "Dashboard", student: "Minha evolução" },
  assessments: {
    admin: "Avaliações",
    teacher: "Avaliações",
    student: "Minhas avaliações",
  },
  users: { admin: "Usuários", teacher: "Alunos", student: "Usuários" },
};

/**
 * Names a screen the same way in the menu, in the page header and in the browser tab.
 *
 * @param screen - Panel screen.
 * @param role - Role of the signed in user.
 * @returns The title shown to that role.
 */
export function getScreenTitle(screen: PanelScreen, role: Role): string {
  return SCREEN_TITLES[screen][role];
}
