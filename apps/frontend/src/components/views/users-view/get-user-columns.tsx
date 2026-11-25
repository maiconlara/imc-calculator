import { HStack, Text } from "@chakra-ui/react";
import type { PublicUser } from "@imc-calculator/shared";
import { RoleBadge } from "@/components/ui/badges";
import type { TableColumn } from "@/components/ui/data-table";
import { formatDate } from "@/lib/formatters";
import { UserAvatar } from "./user-avatar";
import { UserName } from "./user-name";
import { UserRowActions } from "./user-row-actions";
import { UserStatusControl } from "./user-status-control";
import type { UserRowContext } from "./users-view.types";

/**
 * Columns of the users table. The role column only shows when the signed in user may
 * choose roles.
 *
 * @param rowContext - Permissions and handlers shared by every row.
 * @returns The column definitions for `DataTable`.
 */
export function getUserColumns(rowContext: UserRowContext): TableColumn<PublicUser>[] {
  return [
    {
      id: "name",
      header: "Nome",
      renderCell: (user) => (
        <HStack gap="3">
          <UserAvatar user={user} />
          <Text fontWeight="600" whiteSpace="nowrap">
            <UserName user={user} sessionUserId={rowContext.sessionUserId} />
          </Text>
        </HStack>
      ),
    },
    {
      id: "username",
      header: "Usuário",
      renderCell: (user) => (
        <Text fontFamily="mono" fontSize="xs" color="fg.muted">
          {user.username}
        </Text>
      ),
    },
    ...(rowContext.canChooseRole
      ? [
          {
            id: "role",
            header: "Perfil",
            renderCell: (user: PublicUser) => <RoleBadge role={user.role} />,
          },
        ]
      : []),
    {
      id: "status",
      header: "Situação",
      renderCell: (user) => <UserStatusControl user={user} rowContext={rowContext} />,
    },
    {
      id: "createdAt",
      header: "Cadastrado em",
      hideBelow: "xl",
      renderCell: (user) => (
        <Text fontFamily="mono" fontSize="xs" color="fg.muted">
          {formatDate(user.createdAt)}
        </Text>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      align: "end",
      width: "1%",
      renderCell: (user) => <UserRowActions user={user} rowContext={rowContext} />,
    },
  ];
}
