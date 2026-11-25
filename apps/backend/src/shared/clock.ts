export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

/**
 * Returns the first instant of the month of the given date, in the server time zone.
 *
 * @param date - Reference date.
 * @returns Midnight of the first day of that month.
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
