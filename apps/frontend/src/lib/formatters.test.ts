import { describe, expect, it } from "vitest";
import {
  formatBmi,
  formatDate,
  formatDateTime,
  formatHeight,
  formatMonth,
  formatWeight,
  getInitials,
  maskHeight,
  parseDecimal,
  pluralize,
  sanitizeWeight,
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
