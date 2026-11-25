import { Badge } from "@chakra-ui/react";
import {
  BMI_CLASSIFICATION_LABELS,
  type BmiClassification,
} from "@imc-calculator/shared";
import { CLASSIFICATION_VISUALS } from "@/lib/classification-visuals";

export function ClassificationBadge({
  classification,
  size = "md",
}: {
  classification: BmiClassification;
  size?: "sm" | "md" | "lg";
}) {
  const classificationVisual = CLASSIFICATION_VISUALS[classification];
  return (
    <Badge
      colorPalette={classificationVisual.colorPalette}
      variant={classificationVisual.variant}
      size={size}
      borderRadius="full"
      px="2.5"
      whiteSpace="nowrap"
    >
      {BMI_CLASSIFICATION_LABELS[classification]}
    </Badge>
  );
}
