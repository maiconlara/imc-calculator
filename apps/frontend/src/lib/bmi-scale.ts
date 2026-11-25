import { BMI_RANGES } from "@imc-calculator/shared";

const SCALE_MIN_BMI = 15;
const SCALE_MAX_BMI = 45;
const SCALE_BMI_SPAN = SCALE_MAX_BMI - SCALE_MIN_BMI;

/**
 * Position of a BMI on the BMI scale, kept inside its ends.
 *
 * @param bmi - BMI to place on the scale.
 * @returns Distance from the left end of the scale, from 0 to 100.
 */
export function getBmiScalePositionPercent(bmi: number): number {
  const bmiInsideScale = Math.min(SCALE_MAX_BMI, Math.max(SCALE_MIN_BMI, bmi));
  return ((bmiInsideScale - SCALE_MIN_BMI) / SCALE_BMI_SPAN) * 100;
}

/**
 * One segment per band of the BMI table, in the table order, with its share of the
 * scale width. The open ends of the first and last bands stop at the scale ends.
 */
export const BMI_SCALE_SEGMENTS = BMI_RANGES.map((bmiRange) => {
  const segmentStart = bmiRange.min ?? SCALE_MIN_BMI;
  const segmentEnd = bmiRange.max ?? SCALE_MAX_BMI;
  return {
    ...bmiRange,
    widthPercent: ((segmentEnd - segmentStart) / SCALE_BMI_SPAN) * 100,
  };
});

/**
 * BMI values printed below the scale: where each band starts.
 */
export const BMI_SCALE_TICK_VALUES = BMI_RANGES.flatMap((bmiRange) =>
  bmiRange.min === null ? [] : [bmiRange.min],
);
