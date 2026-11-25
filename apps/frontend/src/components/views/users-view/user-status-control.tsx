import { Box, Switch } from "@chakra-ui/react";
import { USER_STATUS_LABELS } from "@imc-calculator/shared";
import { UserStatusIndicator } from "@/components/ui/badges";
import type { UserRowProps } from "./users-view.types";

export function UserStatusControl({ user, rowContext }: UserRowProps) {
  if (user.id === rowContext.sessionUserId) {
    return (
      <Box title="Você não pode inativar a própria conta">
        <UserStatusIndicator status={user.status} />
      </Box>
    );
  }
  if (!rowContext.canManageUsers) {
    return <UserStatusIndicator status={user.status} />;
  }
  const isActive = user.status === "active";
  return (
    <Switch.Root
      size="sm"
      colorPalette="green"
      checked={isActive}
      disabled={rowContext.statusChangingUserId === user.id}
      onCheckedChange={(event) =>
        event.checked ? rowContext.onActivate(user) : rowContext.onDeactivate(user)
      }
    >
      <Switch.HiddenInput
        aria-label={`${isActive ? "Inativar" : "Ativar"} ${user.name}`}
      />
      <Switch.Control />
      <Switch.Label fontSize="sm" color={isActive ? "fg" : "fg.muted"}>
        {USER_STATUS_LABELS[user.status]}
      </Switch.Label>
    </Switch.Root>
  );
}
