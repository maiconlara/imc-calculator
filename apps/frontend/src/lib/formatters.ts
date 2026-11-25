import { GYM_TIME_ZONE } from "@imc-calculator/shared";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: GYM_TIME_ZONE,
});
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: GYM_TIME_ZONE,
});
const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
  timeZone: GYM_TIME_ZONE,
});

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

/**
 * Formats the month of a date for a chart axis, such as "nov/26".
 *
 * @param isoDate - Date in ISO format.
 * @returns The short month and the two digit year.
 */
export function formatMonth(isoDate: string): string {
  return shortMonthFormatter
    .format(new Date(isoDate))
    .replace(".", "")
    .replace(" de ", "/");
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatBmi(bmi: number): string {
  return formatNumber(bmi, 2);
}

export function formatWeight(weight: number): string {
  return `${formatNumber(weight, 1)} kg`;
}

export function formatHeight(height: number): string {
  return `${formatNumber(height, 2)} m`;
}

/**
 * Applies the height mask `0,00`: the first digit is the meters, so typing "171"
 * shows "1,71". Pasting "1.71" or "1,71" gives the same result.
 *
 * @param typedText - Raw input value.
 * @returns The masked height.
 */
export function maskHeight(typedText: string): string {
  const digits = typedText.replace(/\D/g, "").slice(0, 3);
  if (digits.length <= 1) return digits;
  return `${digits.slice(0, 1)},${digits.slice(1)}`;
}

/**
 * Keeps only a valid weight while typing: up to 3 integer digits, one decimal
 * separator (shown as a comma) and up to 2 decimals.
 *
 * @param typedText - Raw input value.
 * @returns The cleaned weight.
 */
export function sanitizeWeight(typedText: string): string {
  const [integerDigits = "", ...decimalDigitGroups] = typedText
    .replace(/\./g, ",")
    .replace(/[^\d,]/g, "")
    .split(",");
  const integerPart = integerDigits.slice(0, 3);
  if (decimalDigitGroups.length === 0) return integerPart;
  return `${integerPart},${decimalDigitGroups.join("").slice(0, 2)}`;
}

/**
 * Parses a decimal typed in Brazilian format ("1,75" or "1.75").
 *
 * @param typedText - Raw input value.
 * @returns The number, or `undefined` when the text is empty or invalid.
 */
export function parseDecimal(typedText: string): number | undefined {
  const normalizedText = typedText.replace(/\s/g, "").replace(",", ".");
  if (normalizedText === "") return undefined;
  const parsedNumber = Number(normalizedText);
  return Number.isFinite(parsedNumber) ? parsedNumber : undefined;
}

/**
 * Builds the initials shown in the avatar: the first letter of the first and of the
 * last word of the name.
 *
 * @param name - Full name.
 * @returns One or two uppercase letters.
 */
export function getInitials(name: string): string {
  const nameParts = name.trim().split(/\s+/);
  const firstInitial = nameParts[0]?.charAt(0) ?? "";
  const lastInitial = nameParts.length > 1 ? (nameParts.at(-1)?.charAt(0) ?? "") : "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/**
 * Writes a count followed by the word that matches it, such as "1 aluno" or
 * "1.200 alunos".
 *
 * @param total - Count to show.
 * @param singular - Word used when the count is 1.
 * @param plural - Word used otherwise; defaults to the singular plus "s".
 * @returns The formatted count and word.
 */
export function pluralize(
  total: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${total.toLocaleString("pt-BR")} ${total === 1 ? singular : plural}`;
}
