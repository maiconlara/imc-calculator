import type { ComponentType } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  TrendingUp,
  Users,
  type LucideProps,
} from "lucide-react";
import type { Role } from "@imc-calculator/shared";
import { permissions } from "@/lib/permissions";
import { PANEL_SCREENS, type PanelScreen } from "@/lib/routes";

const NAV_GROUP_LABELS = ["Acompanhamento", "Cadastros"] as const;

type NavGroupLabel = (typeof NAV_GROUP_LABELS)[number];

export interface NavGroup {
  label: NavGroupLabel;
  screens: PanelScreen[];
}

const SCREEN_NAV_GROUPS: Record<PanelScreen, NavGroupLabel> = {
  dashboard: "Acompanhamento",
  assessments: "Acompanhamento",
  users: "Cadastros",
};

export const SCREEN_ICONS: Record<
  PanelScreen,
  (role: Role) => ComponentType<LucideProps>
> = {
  dashboard: (role) =>
    permissions.canPerform(role, "seeGymNumbers") ? LayoutDashboard : TrendingUp,
  assessments: () => ClipboardList,
  users: () => Users,
};

/**
 * Menu groups of a role, in menu order, each with the screens the role may open. A
 * group with no screen for the role is left out.
 *
 * @param role - Role of the signed in user.
 * @returns The groups to show in the menu.
 */
export function getVisibleNavGroups(role: Role): NavGroup[] {
  return NAV_GROUP_LABELS.map((navGroupLabel) => ({
    label: navGroupLabel,
    screens: PANEL_SCREENS.filter(
      (screen) =>
        SCREEN_NAV_GROUPS[screen] === navGroupLabel &&
        permissions.canOpenScreen(role, screen),
    ),
  })).filter((navGroup) => navGroup.screens.length > 0);
}
