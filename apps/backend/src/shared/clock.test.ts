import { describe, expect, it } from "vitest";
import { startOfMonth } from "./clock";

describe("startOfMonth", () => {
  it("runs the tests outside UTC, so the server time zone is really exercised", () => {
    expect(new Date(2026, 10, 1).getTimezoneOffset()).toBe(180);
  });

  it("starts the month at local midnight, not at UTC midnight", () => {
    expect(startOfMonth(new Date("2026-11-01T02:00:00.000Z")).toISOString()).toBe(
      "2026-10-01T03:00:00.000Z",
    );
    expect(startOfMonth(new Date("2026-11-19T12:00:00.000Z")).toISOString()).toBe(
      "2026-11-01T03:00:00.000Z",
    );
  });
});
