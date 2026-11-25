import { describe, expect, it } from "vitest";
import { BMI_RANGES } from "@imc-calculator/shared";
import {
  BMI_SCALE_SEGMENTS,
  BMI_SCALE_TICK_VALUES,
  getBmiScalePositionPercent,
} from "./bmi-scale";

describe("getBmiScalePositionPercent", () => {
  it.each([
    [15, 0],
    [22.5, 25],
    [30, 50],
    [45, 100],
  ])("places a BMI of %s at %s percent of the scale", (bmi, positionPercent) => {
    expect(getBmiScalePositionPercent(bmi)).toBeCloseTo(positionPercent);
  });

  it.each([
    [12.3, 0],
    [52.8, 100],
  ])("keeps a BMI of %s at the scale end, %s percent", (bmi, positionPercent) => {
    expect(getBmiScalePositionPercent(bmi)).toBe(positionPercent);
  });
});

describe("BMI_SCALE_SEGMENTS", () => {
  it("has one segment per band, in the table order", () => {
    expect(BMI_SCALE_SEGMENTS.map((scaleSegment) => scaleSegment.classification)).toEqual(
      BMI_RANGES.map((bmiRange) => bmiRange.classification),
    );
  });

  it("fills the whole scale", () => {
    const totalWidthPercent = BMI_SCALE_SEGMENTS.reduce(
      (widthSum, scaleSegment) => widthSum + scaleSegment.widthPercent,
      0,
    );
    expect(totalWidthPercent).toBeCloseTo(100);
  });

  it("stops the open first and last bands at the scale ends", () => {
    const firstSegment = BMI_SCALE_SEGMENTS[0];
    const lastSegment = BMI_SCALE_SEGMENTS[BMI_SCALE_SEGMENTS.length - 1];
    expect(firstSegment?.widthPercent).toBeCloseTo(getBmiScalePositionPercent(18.5));
    expect(lastSegment?.widthPercent).toBeCloseTo(100 - getBmiScalePositionPercent(40));
  });
});

describe("BMI_SCALE_TICK_VALUES", () => {
  it("marks where each band starts", () => {
    expect(BMI_SCALE_TICK_VALUES).toEqual([18.5, 25, 30, 35, 40]);
  });
});
