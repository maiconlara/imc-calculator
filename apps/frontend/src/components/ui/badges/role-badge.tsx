import { Badge } from "@chakra-ui/react";
import { ROLE_LABELS, type Role } from "@imc-calculator/shared";

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
