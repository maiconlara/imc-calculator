import { Badge, Status } from "@chakra-ui/react";
import {
  BMI_CLASSIFICATION_LABELS,
  ROLE_LABELS,
  USER_STATUS_LABELS,
  type BmiClassification,
  type Role,
  type UserStatus,
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

const ROLE_BADGE_STYLES: Record<
  Role,
  { colorPalette: string; variant: "solid" | "subtle" }
> = {
  admin: { colorPalette: "graphite", variant: "solid" },
  teacher: { colorPalette: "brand", variant: "solid" },
  student: { colorPalette: "gray", variant: "subtle" },
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge {...ROLE_BADGE_STYLES[role]} borderRadius="full" px="2.5">
      {ROLE_LABELS[role]}
    </Badge>
  );
}

export function UserStatusIndicator({
  status,
  size = "md",
}: {
  status: UserStatus;
  size?: "sm" | "md";
}) {
  const isActive = status === "active";
  return (
    <Status.Root
      size={size}
      colorPalette={isActive ? "green" : "gray"}
      color={isActive ? "fg" : "fg.muted"}
      whiteSpace="nowrap"
    >
      <Status.Indicator />
      {USER_STATUS_LABELS[status]}
    </Status.Root>
  );
}
