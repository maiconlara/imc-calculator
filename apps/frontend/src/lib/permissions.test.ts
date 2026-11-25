import { describe, expect, it } from "vitest";
import { ROLES, type Role } from "@imc-calculator/shared";
import {
  PANEL_ACTIONS,
  ROLE_DESCRIPTIONS,
  permissions,
  type PanelAction,
} from "./permissions";
import { PANEL_SCREENS, type PanelScreen } from "./routes";
import { getManagedUserNoun, getScreenTitle } from "./screen-titles";

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

describe("permissions.canPerform", () => {
  it.each<[Role, PanelAction[]]>([
    [
      "admin",
      [
        "manageUsers",
        "deleteUsers",
        "recordAssessments",
        "editAssessments",
        "deleteAssessments",
        "filterAssessmentsByStudent",
        "filterAssessmentsByTeacher",
      ],
    ],
    [
      "teacher",
      [
        "manageUsers",
        "recordAssessments",
        "editAssessments",
        "filterAssessmentsByStudent",
      ],
    ],
    ["student", []],
  ])("lets the %s do %j and nothing else", (role, allowedActions) => {
    const performableActions = PANEL_ACTIONS.filter((action) =>
      permissions.canPerform(role, action),
    );

    expect(performableActions).toEqual(allowedActions);
  });
});

describe("permissions.getManageableRoles", () => {
  it.each<[Role, Role[]]>([
    ["admin", ["admin", "teacher", "student"]],
    ["teacher", ["student"]],
    ["student", []],
  ])("lets the %s manage %j", (role, manageableRoles) => {
    expect(permissions.getManageableRoles(role)).toEqual(manageableRoles);
  });

  it("offers a role choice only to who manages more than one role", () => {
    expect(permissions.canChooseUserRole("admin")).toBe(true);
    expect(permissions.canChooseUserRole("teacher")).toBe(false);
    expect(permissions.canChooseUserRole("student")).toBe(false);
  });

  it("describes every role the admin can choose in the user form", () => {
    for (const role of permissions.getManageableRoles("admin")) {
      expect(ROLE_DESCRIPTIONS[role]).not.toBe("");
    }
  });
});

describe("getManagedUserNoun", () => {
  it("calls the people a teacher manages students, as the screen title does", () => {
    expect(getManagedUserNoun("teacher")).toEqual({
      singular: "aluno",
      plural: "alunos",
    });
    expect(getManagedUserNoun("admin")).toEqual({
      singular: "usuário",
      plural: "usuários",
    });
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
