import { describe, expect, it } from "vitest";
import { GYM_TIME_ZONE } from "@imc-calculator/shared";
import { startOfMonth } from "./clock";

describe("startOfMonth", () => {
  it("runs the tests outside the gym time zone, so a dependency on the machine zone fails", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).not.toBe(GYM_TIME_ZONE);
  });

  it("starts the month at midnight in the gym time zone", () => {
    expect(startOfMonth(new Date("2026-11-01T02:59:59.999Z")).toISOString()).toBe(
      "2026-10-01T03:00:00.000Z",
    );
    expect(startOfMonth(new Date("2026-11-01T03:00:00.000Z")).toISOString()).toBe(
      "2026-11-01T03:00:00.000Z",
    );
    expect(startOfMonth(new Date("2026-11-19T12:00:00.000Z")).toISOString()).toBe(
      "2026-11-01T03:00:00.000Z",
    );
  });

  it("uses the offset of the first day, even when daylight saving time changed it later in the month", () => {
    expect(startOfMonth(new Date("2019-02-20T12:00:00.000Z")).toISOString()).toBe(
      "2019-02-01T02:00:00.000Z",
    );
  });
});
