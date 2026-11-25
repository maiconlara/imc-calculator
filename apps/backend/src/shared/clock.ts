import { GYM_TIME_ZONE } from "@imc-calculator/shared";

export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

const gymWallClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: GYM_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

/**
 * Reads the date and time shown by the gym's wall clock at an instant.
 *
 * @param instant - Instant to read.
 * @returns The calendar parts in the gym time zone, with the month starting at 0.
 */
function readGymWallClock(instant: Date) {
  const partValues = new Map(
    gymWallClockFormatter
      .formatToParts(instant)
      .map((part) => [part.type, Number(part.value)]),
  );
  const readPart = (partType: Intl.DateTimeFormatPartTypes) =>
    partValues.get(partType) ?? 0;
  return {
    year: readPart("year"),
    monthIndex: readPart("month") - 1,
    day: readPart("day"),
    hour: readPart("hour"),
    minute: readPart("minute"),
    second: readPart("second"),
  };
}

/**
 * Measures how far the gym's wall clock is from UTC at an instant.
 *
 * @param instant - Instant to measure.
 * @returns The offset in milliseconds, negative west of UTC.
 */
function getGymUtcOffset(instant: Date): number {
  const wallClock = readGymWallClock(instant);
  const wallClockAsUtc = Date.UTC(
    wallClock.year,
    wallClock.monthIndex,
    wallClock.day,
    wallClock.hour,
    wallClock.minute,
    wallClock.second,
  );
  const instantInWholeSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  return wallClockAsUtc - instantInWholeSeconds;
}

/**
 * Returns the first instant of the month of the given date in the gym time zone,
 * whatever the time zone of the machine that runs the API.
 *
 * @param date - Reference date.
 * @returns Midnight of the first day of that month, in the gym time zone.
 */
export function startOfMonth(date: Date): Date {
  const { year, monthIndex } = readGymWallClock(date);
  const firstDayAsUtc = Date.UTC(year, monthIndex, 1);
  const approximateStart = firstDayAsUtc - getGymUtcOffset(new Date(firstDayAsUtc));
  return new Date(firstDayAsUtc - getGymUtcOffset(new Date(approximateStart)));
}
