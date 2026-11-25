import { describe, expect, it } from "vitest";
import { LayoutDashboard, TrendingUp } from "lucide-react";
import { SCREEN_ICONS, getVisibleNavGroups } from "./sidebar-navigation";

describe("getVisibleNavGroups", () => {
  it.each(["admin", "teacher"] as const)("shows every group to %s", (role) => {
    expect(getVisibleNavGroups(role)).toEqual([
      { label: "Acompanhamento", screens: ["dashboard", "assessments"] },
      { label: "Cadastros", screens: ["users"] },
    ]);
  });

  it("leaves out a group with no screen the student may open", () => {
    expect(getVisibleNavGroups("student")).toEqual([
      { label: "Acompanhamento", screens: ["dashboard", "assessments"] },
    ]);
  });
});

describe("SCREEN_ICONS", () => {
  it.each([
    ["admin", LayoutDashboard],
    ["teacher", LayoutDashboard],
    ["student", TrendingUp],
  ] as const)("gives %s the dashboard icon of its dashboard", (role, dashboardIcon) => {
    expect(SCREEN_ICONS.dashboard(role)).toBe(dashboardIcon);
  });
});
