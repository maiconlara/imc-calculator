import type { BmiClassification } from "@imc-calculator/shared";

interface ClassificationVisual {
  colorPalette: "blue" | "green" | "yellow" | "orange" | "red";
  variant: "subtle" | "solid";
  color: string;
}

export const CLASSIFICATION_VISUALS: Record<BmiClassification, ClassificationVisual> = {
  underweight: { colorPalette: "blue", variant: "subtle", color: "blue.500" },
  "normal-weight": { colorPalette: "green", variant: "subtle", color: "green.500" },
  overweight: { colorPalette: "yellow", variant: "subtle", color: "brand.500" },
  "obesity-class-1": { colorPalette: "orange", variant: "subtle", color: "orange.500" },
  "obesity-class-2": { colorPalette: "red", variant: "subtle", color: "red.500" },
  "obesity-class-3": { colorPalette: "red", variant: "solid", color: "red.800" },
};
