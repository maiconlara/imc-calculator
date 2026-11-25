import { describe, expect, it } from "vitest";
import {
  formatBmi,
  formatChange,
  formatDate,
  formatDateTime,
  formatHeight,
  formatMonth,
  formatWeight,
  getChangeDirection,
  getFirstName,
  getInitials,
  maskHeight,
  parseDecimal,
  pluralize,
  sanitizeWeight,
  type ChangeDirection,
} from "./formatters";

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

describe("getFirstName", () => {
  it.each([
    ["Pedro Henrique Costa", "Pedro"],
    ["  ana   oliveira ", "ana"],
    ["admin", "admin"],
    ["   ", ""],
  ])("turns %j into %j", (name, firstName) => {
    expect(getFirstName(name)).toBe(firstName);
  });
});

describe("getChangeDirection", () => {
  it.each<[number, number, ChangeDirection]>([
    [2.5, 1, "up"],
    [-6, 1, "down"],
    [0, 1, "flat"],
    [0.04, 1, "flat"],
    [-0.004, 2, "flat"],
    [0.05, 1, "up"],
    [-0.05, 1, "down"],
  ])("reads a change of %s with %s decimals as %s", (change, decimals, direction) => {
    expect(getChangeDirection(change, decimals)).toBe(direction);
  });
});

describe("formatChange", () => {
  it("marks a rise with a plus sign", () => {
    expect(formatChange(2.5, 1, " kg")).toBe("+2,5 kg");
  });

  it("marks a drop with the minus sign, not a hyphen", () => {
    expect(formatChange(-6, 1, " kg")).toBe("−6,0 kg");
    expect(formatChange(-1.9600000000000009, 2)).toBe("−1,96");
  });

  it("shows no sign when the change rounds to zero", () => {
    expect(formatChange(0)).toBe("0,0");
    expect(formatChange(0.04, 1, " kg")).toBe("0,0 kg");
    expect(formatChange(-0.004, 2)).toBe("0,00");
  });

  it("rounds a drop and a rise of the same size alike", () => {
    expect(formatChange(0.05)).toBe("+0,1");
    expect(formatChange(-0.05)).toBe("−0,1");
  });

  it("uses one decimal and no suffix by default", () => {
    expect(formatChange(3)).toBe("+3,0");
  });
});

describe("date formatters", () => {
  it("shows dates in the gym time zone, whatever the time zone of the machine", () => {
    expect(formatDate("2026-11-24T01:30:00.000Z")).toBe("23/11/2026");
    expect(formatDateTime("2026-11-24T01:30:00.000Z")).toBe("23/11/2026, 22:30");
  });

  it("shows the month of a chart point as month and year", () => {
    expect(formatMonth("2026-11-10T10:00:00.000Z")).toBe("nov/26");
    expect(formatMonth("2026-01-01T02:00:00.000Z")).toBe("dez/25");
  });
});

describe("measure formatters", () => {
  it("uses a decimal comma and the unit of each measure", () => {
    expect(formatBmi(26.1)).toBe("26,10");
    expect(formatWeight(72.5)).toBe("72,5 kg");
    expect(formatHeight(1.7)).toBe("1,70 m");
  });
});

describe("parseDecimal", () => {
  it.each([
    ["1,75", 1.75],
    ["1.75", 1.75],
    [" 72,5 ", 72.5],
    ["80", 80],
  ])("reads %j as %s", (typedText, expected) => {
    expect(parseDecimal(typedText)).toBe(expected);
  });

  it.each(["", "   ", "abc", "1,7,5"])("returns undefined for %j", (typedText) => {
    expect(parseDecimal(typedText)).toBeUndefined();
  });
});

describe("maskHeight", () => {
  it.each([
    ["1", "1"],
    ["17", "1,7"],
    ["171", "1,71"],
    ["1715", "1,71"],
    ["1.71", "1,71"],
    ["1,7", "1,7"],
    ["05", "0,5"],
    ["abc", ""],
  ])("shows %j as %j", (typedText, expected) => {
    expect(maskHeight(typedText)).toBe(expected);
  });
});

describe("sanitizeWeight", () => {
  it.each([
    ["72", "72"],
    ["72,5", "72,5"],
    ["72.5", "72,5"],
    ["105,155", "105,15"],
    ["1234", "123"],
    ["7a2,5kg", "72,5"],
    ["72,5,3", "72,53"],
  ])("shows %j as %j", (typedText, expected) => {
    expect(sanitizeWeight(typedText)).toBe(expected);
  });
});

describe("pluralize", () => {
  it("matches the word to the number", () => {
    expect(pluralize(1, "avaliação", "avaliações")).toBe("1 avaliação");
    expect(pluralize(0, "avaliação", "avaliações")).toBe("0 avaliações");
    expect(pluralize(1200, "aluno")).toBe("1.200 alunos");
  });
});
