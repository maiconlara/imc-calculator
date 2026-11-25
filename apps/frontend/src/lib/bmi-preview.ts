import {
  assessBmi,
  heightSchema,
  weightSchema,
  type BmiClassification,
} from "@imc-calculator/shared";
import { parseDecimal } from "./formatters";

export type BmiPreview =
  | { kind: "result"; bmi: number; classification: BmiClassification }
  | { kind: "hint"; message: string; isOutOfRange: boolean };

function getOutOfRangeMessage(
  measure: number | undefined,
  measureSchema: typeof heightSchema,
): string | undefined {
  if (measure === undefined) return undefined;
  const measureCheck = measureSchema.safeParse(measure);
  return measureCheck.success ? undefined : measureCheck.error.issues[0]?.message;
}

/**
 * Builds the live BMI preview of the assessment form, explaining why it is missing
 * with the same messages the API gives when a value is out of the accepted range.
 *
 * @param typedHeight - Height as typed, already masked.
 * @param typedWeight - Weight as typed.
 * @returns The BMI result or the hint shown in its place.
 */
export function buildBmiPreview(typedHeight: string, typedWeight: string): BmiPreview {
  const height = parseDecimal(typedHeight);
  const weight = parseDecimal(typedWeight);
  const outOfRangeMessage =
    getOutOfRangeMessage(height, heightSchema) ??
    getOutOfRangeMessage(weight, weightSchema);
  if (outOfRangeMessage) {
    return { kind: "hint", message: outOfRangeMessage, isOutOfRange: true };
  }
  if (height === undefined || weight === undefined) {
    return {
      kind: "hint",
      message: "Preencha altura e peso para ver o resultado.",
      isOutOfRange: false,
    };
  }
  return { kind: "result", ...assessBmi(weight, height) };
}
