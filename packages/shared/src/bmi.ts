export interface BmiBandDefinition {
  classification: string;
  label: string;
  minBmi: number | null;
}

/**
 * BMI bands from the lowest to the highest, the single source of the classification.
 * Each band starts at `minBmi` (inclusive) and ends where the next one starts.
 * `label` is the official name shown on screen and stored with the assessment.
 */
export const BMI_BANDS = [
  { classification: "underweight", label: "Abaixo do peso", minBmi: null },
  { classification: "normal-weight", label: "Peso normal", minBmi: 18.5 },
  { classification: "overweight", label: "Sobrepeso", minBmi: 25 },
  { classification: "obesity-class-1", label: "Obesidade grau I", minBmi: 30 },
  { classification: "obesity-class-2", label: "Obesidade grau II", minBmi: 35 },
  { classification: "obesity-class-3", label: "Obesidade grau III", minBmi: 40 },
] as const satisfies readonly BmiBandDefinition[];

export type BmiBand = (typeof BMI_BANDS)[number];

export type BmiClassification = BmiBand["classification"];

export const BMI_CLASSIFICATIONS: readonly BmiClassification[] = BMI_BANDS.map(
  (band) => band.classification,
);

export const BMI_CLASSIFICATION_LABELS = Object.fromEntries(
  BMI_BANDS.map((band) => [band.classification, band.label]),
) as Record<BmiClassification, string>;

export interface BmiRange {
  classification: BmiClassification;
  min: number | null;
  max: number | null;
}

export const BMI_RANGES: readonly BmiRange[] = BMI_BANDS.map((band, bandIndex) => ({
  classification: band.classification,
  min: band.minBmi,
  max: BMI_BANDS[bandIndex + 1]?.minBmi ?? null,
}));

/**
 * Rounds a number to a fixed amount of decimal places.
 *
 * @param value - Value to round.
 * @param decimals - Decimal places to keep.
 * @returns The rounded value.
 */
export function roundTo(value: number, decimals = 2): number {
  const decimalFactor = 10 ** decimals;
  return Math.round(Number((value * decimalFactor).toPrecision(15))) / decimalFactor;
}

/**
 * Calculates the body mass index (weight / height²), rounded to 2 decimals.
 *
 * @param weight - Weight in kilograms.
 * @param height - Height in meters.
 * @returns The BMI value.
 */
export function calculateBmi(weight: number, height: number): number {
  if (!(weight > 0) || !(height > 0)) {
    throw new RangeError("Weight and height must be greater than zero");
  }
  return roundTo(weight / (height * height));
}

/**
 * Classifies a BMI value with the band table.
 *
 * @param bmi - BMI already rounded to 2 decimals.
 * @returns The classification of the highest band whose lower limit the value reaches.
 */
export function classifyBmi(bmi: number): BmiClassification {
  const matchingBand = BMI_BANDS.findLast(
    (band) => band.minBmi === null || bmi >= band.minBmi,
  );
  return matchingBand?.classification ?? BMI_BANDS[0].classification;
}

/**
 * Calculates and classifies the BMI in one step.
 *
 * @param weight - Weight in kilograms.
 * @param height - Height in meters.
 * @returns The BMI and its classification.
 */
export function assessBmi(
  weight: number,
  height: number,
): { bmi: number; classification: BmiClassification } {
  const bmi = calculateBmi(weight, height);
  return { bmi, classification: classifyBmi(bmi) };
}

/**
 * Builds the human readable range of a BMI band, such as "18,5 a 24,9".
 *
 * @param range - BMI band.
 * @returns The formatted range, in Brazilian Portuguese.
 */
export function describeBmiRange(range: BmiRange): string {
  const formatBound = (bound: number) =>
    bound.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  if (range.min === null && range.max !== null) {
    return `Menor que ${formatBound(range.max)}`;
  }
  if (range.max === null && range.min !== null) {
    return `${formatBound(range.min)} ou mais`;
  }
  return `${formatBound(range.min ?? 0)} a ${formatBound((range.max ?? 0) - 0.1)}`;
}
