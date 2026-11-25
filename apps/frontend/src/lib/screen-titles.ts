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

interface ManagedUserNoun {
  singular: string;
  plural: string;
}

const MANAGED_USER_NOUNS: Record<Role, ManagedUserNoun> = {
  admin: { singular: "usuário", plural: "usuários" },
  teacher: { singular: "aluno", plural: "alunos" },
  student: { singular: "usuário", plural: "usuários" },
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

/**
 * Names the people a role manages on the users screen, matching its title: a teacher
 * only manages students, so buttons, dialogs and counters say "aluno".
 *
 * @param role - Role of the signed in user.
 * @returns The lowercase singular and plural noun.
 */
export function getManagedUserNoun(role: Role): ManagedUserNoun {
  return MANAGED_USER_NOUNS[role];
}
