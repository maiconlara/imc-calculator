import { Status } from "@chakra-ui/react";
import { USER_STATUS_LABELS, type UserStatus } from "@imc-calculator/shared";

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
