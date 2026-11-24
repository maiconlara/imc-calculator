import { describe, expect, it } from "vitest";
import {
  BMI_BANDS,
  BMI_CLASSIFICATIONS,
  BMI_CLASSIFICATION_LABELS,
  BMI_RANGES,
  assessBmi,
  calculateBmi,
  classifyBmi,
  describeBmiRange,
} from "./bmi";

describe("BMI_BANDS", () => {
  it("starts with an open lower band and has increasing limits", () => {
    expect(BMI_BANDS[0].minBmi).toBeNull();
    const lowerLimits = BMI_BANDS.slice(1).map((band) => band.minBmi);
    expect(lowerLimits.every((minBmi) => typeof minBmi === "number")).toBe(true);
    expect(lowerLimits).toEqual([...lowerLimits].sort((a, b) => Number(a) - Number(b)));
    expect(new Set(lowerLimits).size).toBe(lowerLimits.length);
  });

  it("has unique classifications and labels", () => {
    expect(new Set(BMI_CLASSIFICATIONS).size).toBe(BMI_BANDS.length);
    expect(new Set(Object.values(BMI_CLASSIFICATION_LABELS)).size).toBe(BMI_BANDS.length);
  });

  it("keeps every label within the 30 characters of the stored classification", () => {
    expect(BMI_BANDS.every((band) => band.label.length <= 30)).toBe(true);
  });

  it("derives the classification list, the labels and the ranges in band order", () => {
    expect(BMI_CLASSIFICATIONS).toEqual(BMI_BANDS.map((band) => band.classification));
    expect(BMI_CLASSIFICATION_LABELS.overweight).toBe("Sobrepeso");
    BMI_RANGES.forEach((range, rangeIndex) => {
      expect(range.max).toBe(BMI_RANGES[rangeIndex + 1]?.min ?? null);
    });
  });
});

describe("calculateBmi", () => {
  it("divides the weight by the squared height and rounds to 2 decimals", () => {
    expect(calculateBmi(70, 1.75)).toBe(22.86);
    expect(calculateBmi(90, 1.8)).toBe(27.78);
  });

  it("rejects a zero weight or height", () => {
    expect(() => calculateBmi(0, 1.75)).toThrow(RangeError);
    expect(() => calculateBmi(70, 0)).toThrow(RangeError);
  });
});

describe("classifyBmi", () => {
  it.each([
    [16, "underweight"],
    [18.49, "underweight"],
    [18.5, "normal-weight"],
    [24.99, "normal-weight"],
    [25, "overweight"],
    [29.99, "overweight"],
    [30, "obesity-class-1"],
    [34.99, "obesity-class-1"],
    [35, "obesity-class-2"],
    [39.99, "obesity-class-2"],
    [40, "obesity-class-3"],
    [55, "obesity-class-3"],
  ] as const)("classifies BMI %s as %s", (bmi, expectedClassification) => {
    expect(classifyBmi(bmi)).toBe(expectedClassification);
  });

  it("puts every lower limit in its own band and the value just below it in the previous band", () => {
    BMI_BANDS.forEach((band, bandIndex) => {
      const previousBand = BMI_BANDS[bandIndex - 1];
      if (band.minBmi === null || !previousBand) return;
      expect(classifyBmi(band.minBmi)).toBe(band.classification);
      expect(classifyBmi(band.minBmi - 0.01)).toBe(previousBand.classification);
    });
  });
});

describe("assessBmi", () => {
  it("classifies the rounded value, the same one that is stored and shown", () => {
    const assessedBmi = assessBmi(76.56, 1.75);
    expect(assessedBmi.bmi).toBe(25);
    expect(assessedBmi.classification).toBe("overweight");
  });

  it.each([
    [56, 1.75, 18.29, "underweight"],
    [80, 1.75, 26.12, "overweight"],
    [80, 1.6, 31.25, "obesity-class-1"],
    [95, 1.6, 37.11, "obesity-class-2"],
    [110, 1.6, 42.97, "obesity-class-3"],
  ] as const)(
    "assesses %s kg and %s m as BMI %s (%s)",
    (weight, height, expectedBmi, expectedClassification) => {
      expect(assessBmi(weight, height)).toEqual({
        bmi: expectedBmi,
        classification: expectedClassification,
      });
    },
  );
});

describe("describeBmiRange", () => {
  it("builds the text of every band in the table", () => {
    expect(BMI_RANGES.map(describeBmiRange)).toEqual([
      "Menor que 18,5",
      "18,5 a 24,9",
      "25 a 29,9",
      "30 a 34,9",
      "35 a 39,9",
      "40 ou mais",
    ]);
  });
});
