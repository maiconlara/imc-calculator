import { RowActions } from "@/components/ui/row-actions";
import type { UserRowProps } from "./users-view.types";

export function UserRowActions({ user, rowContext }: UserRowProps) {
  const canDeleteThisUser =
    rowContext.canDeleteUsers && user.id !== rowContext.sessionUserId;
  return (
    <RowActions
      editLabel={`Editar ${user.name}`}
      deleteLabel={`Excluir ${user.name}`}
      onEdit={rowContext.canManageUsers ? () => rowContext.onEdit(user) : undefined}
      onDelete={canDeleteThisUser ? () => rowContext.onDelete(user) : undefined}
    />
  );
}
