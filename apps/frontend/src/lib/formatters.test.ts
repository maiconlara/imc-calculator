import { describe, expect, it } from "vitest";
import { getInitials } from "./formatters";

describe("getInitials", () => {
  it.each([
    ["Pedro Henrique Costa", "PC"],
    ["  ana   oliveira ", "AO"],
    ["Administrador da Academia", "AA"],
    ["admin", "A"],
    ["Érica Santos", "ÉS"],
  ])("turns %j into %j", (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});
