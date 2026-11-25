import { describe, expect, it } from "vitest";
import { ROLES, type Role } from "@imc-calculator/shared";
import { permissions } from "./permissions";
import { PANEL_SCREENS, type PanelScreen } from "./routes";
import { getScreenTitle } from "./screen-titles";

describe("permissions.canOpenScreen", () => {
  it.each<[Role, PanelScreen[]]>([
    ["admin", ["dashboard", "assessments", "users"]],
    ["teacher", ["dashboard", "assessments", "users"]],
    ["student", ["dashboard", "assessments"]],
  ])("lets the %s open %j and nothing else", (role, allowedScreens) => {
    const openableScreens = PANEL_SCREENS.filter((screen) =>
      permissions.canOpenScreen(role, screen),
    );

    expect(openableScreens).toEqual(allowedScreens);
  });
});

describe("getScreenTitle", () => {
  it.each<[PanelScreen, Role, string]>([
    ["dashboard", "admin", "Dashboard"],
    ["dashboard", "student", "Minha evolução"],
    ["assessments", "teacher", "Avaliações"],
    ["assessments", "student", "Minhas avaliações"],
    ["users", "admin", "Usuários"],
    ["users", "teacher", "Alunos"],
  ])("names %s for the %s as %s", (screen, role, title) => {
    expect(getScreenTitle(screen, role)).toBe(title);
  });

  it("names every screen for every role", () => {
    for (const screen of PANEL_SCREENS) {
      for (const role of ROLES) {
        expect(getScreenTitle(screen, role)).not.toBe("");
      }
    }
  });
});
