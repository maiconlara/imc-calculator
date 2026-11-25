import type { BmiClassification } from "@imc-calculator/shared";

interface ClassificationVisual {
  color: string;
}

export const CLASSIFICATION_VISUALS: Record<BmiClassification, ClassificationVisual> = {
  underweight: { color: "blue.500" },
  "normal-weight": { color: "green.500" },
  overweight: { color: "brand.500" },
  "obesity-class-1": { color: "orange.500" },
  "obesity-class-2": { color: "red.500" },
  "obesity-class-3": { color: "red.800" },
};
