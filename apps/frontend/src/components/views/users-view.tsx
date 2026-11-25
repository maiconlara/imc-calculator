"use client";

import { useState } from "react";
import {
  Box,
  Card,
  Center,
  Flex,
  HStack,
  IconButton,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Pencil, SearchX, Trash2, Users } from "lucide-react";
import {
  ROLE_LABELS,
  USER_SEARCH_MAX_LENGTH,
  USER_STATUSES,
  USER_STATUS_LABELS,
  type PublicUser,
  type Role,
  type UserStatus,
} from "@imc-calculator/shared";
import { RoleBadge, UserStatusIndicator } from "@/components/ui/badges";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { FilterBar, FilterSelect, type FilterOption } from "@/components/ui/filter-bar";
import { notify } from "@/components/ui/toaster";
import {
  useChangeUserStatus,
  useDebounce,
  useDeleteUser,
  useGetUsers,
  useSessionUser,
} from "@/hooks";
import { getErrorMessage, getErrorStatus } from "@/lib/api-errors";
import { formatDate, getInitials } from "@/lib/formatters";
import { INITIAL_USERS_FILTERS } from "@/lib/initial-filters";
import { permissions } from "@/lib/permissions";
import { getManagedUserNoun } from "@/lib/screen-titles";
import { NewUserButton } from "./new-user-button";
import { UserFormDialog } from "./user-form-dialog";

const SEARCH_DEBOUNCE_MS = 400;

const STATUS_FILTER_OPTIONS: readonly FilterOption<UserStatus>[] = USER_STATUSES.map(
  (status) => ({ value: status, label: USER_STATUS_LABELS[status] }),
);

type UserConfirmation = {
  action: "deactivate" | "delete" | "deactivateInsteadOfDelete";
  user: PublicUser;
};

interface UserRowContext {
  sessionUserId: string;
  canChooseRole: boolean;
  canDeleteUsers: boolean;
  statusChangingUserId: string | undefined;
  onEdit: (user: PublicUser) => void;
  onActivate: (user: PublicUser) => void;
  onDeactivate: (user: PublicUser) => void;
  onDelete: (user: PublicUser) => void;
}

/**
 * Writes the title, text and button of the confirmation dialog of each user action.
 *
 * @param confirmation - Action waiting for confirmation and the user it affects.
 * @returns The texts and the tone of the dialog.
 */
function getConfirmationCopy({ action, user }: UserConfirmation) {
  if (action === "delete") {
    return {
      title: "Excluir cadastro?",
      description: `${user.name} será removido do sistema. Não dá para desfazer.`,
      confirmLabel: "Excluir",
      tone: "danger",
    } as const;
  }
  if (action === "deactivateInsteadOfDelete") {
    return {
      title: "Inativar em vez de excluir?",
      description: `${user.name} tem avaliações vinculadas e não pode ser excluído. Inativar tira o acesso na hora e mantém o histórico.`,
      confirmLabel: "Inativar",
      tone: "warning",
    } as const;
  }
  return {
    title: "Inativar cadastro?",
    description:
      user.role === "student"
        ? `${user.name} perde o acesso na hora e não pode receber novas avaliações. Dá para reativar depois.`
        : `${user.name} perde o acesso na hora. Dá para reativar depois.`,
    confirmLabel: "Inativar",
    tone: "warning",
  } as const;
}

export function UsersView() {
  const sessionUser = useSessionUser();
  const canChooseRole = permissions.canChooseUserRole(sessionUser.role);
  const managedUserNoun = getManagedUserNoun(sessionUser.role);
  const roleFilterOptions: readonly FilterOption<Role>[] = permissions
    .getManageableRoles(sessionUser.role)
    .map((role) => ({ value: role, label: ROLE_LABELS[role] }));

  const [searchText, setSearchText] = useState("");
  const typedSearchText = searchText.trim();
  const debouncedSearchText = useDebounce(typedSearchText, SEARCH_DEBOUNCE_MS);
  const isSearchPending = typedSearchText !== debouncedSearchText;
  const [selectedRole, setSelectedRole] = useState<Role>();
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>();
  const [page, setPage] = useState<number>(INITIAL_USERS_FILTERS.page);
  const [userToEdit, setUserToEdit] = useState<PublicUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<UserConfirmation | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const usersQuery = useGetUsers({
    ...INITIAL_USERS_FILTERS,
    page,
    search: debouncedSearchText || undefined,
    role: selectedRole,
    status: selectedStatus,
  });
  const changeUserStatus = useChangeUserStatus();
  const deleteUser = useDeleteUser();
  const activeFilterCount = [typedSearchText, selectedRole, selectedStatus].filter(
    Boolean,
  ).length;
  const hasQueriedFilters = [debouncedSearchText, selectedRole, selectedStatus].some(
    Boolean,
  );

  function applyFilterAndResetPage(applyFilter: () => void) {
    applyFilter();
    setPage(1);
  }

  function clearFilters() {
    applyFilterAndResetPage(() => {
      setSearchText("");
      setSelectedRole(undefined);
      setSelectedStatus(undefined);
    });
  }

  function askConfirmation(nextConfirmation: UserConfirmation) {
    setConfirmation(nextConfirmation);
    setIsConfirmDialogOpen(true);
  }

  function changeStatusOf(user: PublicUser, newStatus: UserStatus) {
    changeUserStatus.mutate(
      { userId: user.id, status: newStatus },
      {
        onSuccess: () => {
          notify.success(
            newStatus === "active"
              ? `${user.name} foi reativado e já pode entrar.`
              : `${user.name} foi inativado e perdeu o acesso.`,
          );
          setIsConfirmDialogOpen(false);
        },
        onError: (error) =>
          notify.error(getErrorMessage(error, "Não foi possível mudar a situação.")),
      },
    );
  }

  function offerDeactivationInsteadOfDelete(user: PublicUser) {
    if (user.status === "active") {
      askConfirmation({ action: "deactivateInsteadOfDelete", user });
      return;
    }
    setIsConfirmDialogOpen(false);
    notify.error(
      `${user.name} tem avaliações vinculadas e não pode ser excluído. O cadastro já está inativo e sem acesso.`,
    );
  }

  function deleteConfirmedUser(user: PublicUser) {
    const isLastRowOfPage = usersQuery.data?.items.length === 1 && page > 1;
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        notify.success(`${user.name} foi excluído.`);
        setIsConfirmDialogOpen(false);
        if (isLastRowOfPage) setPage(page - 1);
      },
      onError: (error) => {
        if (getErrorStatus(error) === 409) {
          offerDeactivationInsteadOfDelete(user);
          return;
        }
        notify.error(getErrorMessage(error, "Não foi possível excluir o usuário."));
      },
    });
  }

  function confirmPendingAction() {
    if (!confirmation) return;
    if (confirmation.action === "delete") {
      deleteConfirmedUser(confirmation.user);
      return;
    }
    changeStatusOf(confirmation.user, "inactive");
  }

  const rowContext: UserRowContext = {
    sessionUserId: sessionUser.id,
    canChooseRole,
    canDeleteUsers: permissions.canPerform(sessionUser.role, "deleteUsers"),
    statusChangingUserId: changeUserStatus.isPending
      ? changeUserStatus.variables?.userId
      : undefined,
    onEdit: (user) => {
      setUserToEdit(user);
      setIsEditDialogOpen(true);
    },
    onActivate: (user) => changeStatusOf(user, "active"),
    onDeactivate: (user) => askConfirmation({ action: "deactivate", user }),
    onDelete: (user) =>
      user.hasAssessments
        ? offerDeactivationInsteadOfDelete(user)
        : askConfirmation({ action: "delete", user }),
  };

  const userColumns: TableColumn<PublicUser>[] = [
    {
      id: "name",
      header: "Nome",
      renderCell: (user) => (
        <HStack gap="3">
          <UserAvatar user={user} />
          <Text fontWeight="600" whiteSpace="nowrap">
            <UserName user={user} sessionUserId={sessionUser.id} />
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
    ...(canChooseRole
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
      renderCell: (user) => <UserActions user={user} rowContext={rowContext} />,
    },
  ];

  const confirmationCopy = confirmation ? getConfirmationCopy(confirmation) : null;

  return (
    <>
      <FilterBar
        search={{
          value: searchText,
          onChange: (typedText) =>
            applyFilterAndResetPage(() => setSearchText(typedText)),
          placeholder: "Nome ou usuário",
          maxLength: USER_SEARCH_MAX_LENGTH,
        }}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
      >
        {canChooseRole ? (
          <FilterSelect
            label="Perfil"
            value={selectedRole}
            onChange={(role) => applyFilterAndResetPage(() => setSelectedRole(role))}
            options={roleFilterOptions}
          />
        ) : null}
        <FilterSelect
          label="Situação"
          value={selectedStatus}
          onChange={(status) => applyFilterAndResetPage(() => setSelectedStatus(status))}
          options={STATUS_FILTER_OPTIONS}
          allOptionLabel="Todas"
        />
      </FilterBar>

      <DataTable
        rows={usersQuery.data?.items ?? []}
        columns={userColumns}
        getRowKey={(user) => user.id}
        renderCard={(user) => <UserCard user={user} rowContext={rowContext} />}
        isLoading={usersQuery.isPending}
        isRefreshing={usersQuery.isPlaceholderData || isSearchPending}
        loadError={usersQuery.error}
        onRetry={() => void usersQuery.refetch()}
        emptyState={{
          icon: Users,
          title: `Nenhum ${managedUserNoun.singular} cadastrado ainda`,
          description: `Cadastre o primeiro ${managedUserNoun.singular} para começar.`,
          action: <NewUserButton />,
        }}
        filteredEmptyState={{
          icon: SearchX,
          title: "Ninguém encontrado",
          description: "Nenhum cadastro corresponde à busca e aos filtros escolhidos.",
        }}
        hasActiveFilters={hasQueriedFilters}
        onClearFilters={clearFilters}
        pagination={{
          page,
          pageSize: INITIAL_USERS_FILTERS.pageSize,
          total: usersQuery.data?.total ?? 0,
          onPageChange: setPage,
        }}
        itemNoun={managedUserNoun}
      />

      <UserFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        userToEdit={userToEdit}
      />

      {confirmation && confirmationCopy ? (
        <ConfirmDialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
          onConfirm={confirmPendingAction}
          title={confirmationCopy.title}
          description={confirmationCopy.description}
          confirmLabel={confirmationCopy.confirmLabel}
          tone={confirmationCopy.tone}
          isPending={changeUserStatus.isPending || deleteUser.isPending}
        />
      ) : null}
    </>
  );
}

function UserAvatar({ user }: { user: PublicUser }) {
  const isActive = user.status === "active";
  return (
    <Center
      boxSize="8"
      flexShrink={0}
      borderRadius="full"
      bg={isActive ? "graphite.900" : "bg.muted"}
      color={isActive ? "brand.solid" : "fg.muted"}
      fontSize="2xs"
      fontWeight="800"
      aria-hidden="true"
    >
      {getInitials(user.name)}
    </Center>
  );
}

function UserName({ user, sessionUserId }: { user: PublicUser; sessionUserId: string }) {
  return (
    <>
      {user.name}
      {user.id === sessionUserId ? (
        <Text as="span" ml="2" textStyle="monoLabel" color="fg.muted">
          (você)
        </Text>
      ) : null}
    </>
  );
}

function UserStatusControl({
  user,
  rowContext,
}: {
  user: PublicUser;
  rowContext: UserRowContext;
}) {
  if (user.id === rowContext.sessionUserId) {
    return (
      <Box title="Você não pode inativar a própria conta">
        <UserStatusIndicator status={user.status} />
      </Box>
    );
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

function UserActions({
  user,
  rowContext,
}: {
  user: PublicUser;
  rowContext: UserRowContext;
}) {
  const canDeleteThisUser =
    rowContext.canDeleteUsers && user.id !== rowContext.sessionUserId;
  return (
    <HStack gap="1" justify="end">
      <IconButton
        size="sm"
        variant="outline"
        aria-label={`Editar ${user.name}`}
        title="Editar"
        onClick={() => rowContext.onEdit(user)}
      >
        <Pencil />
      </IconButton>
      {canDeleteThisUser ? (
        <IconButton
          size="sm"
          variant="outline"
          colorPalette="red"
          aria-label={`Excluir ${user.name}`}
          title="Excluir"
          onClick={() => rowContext.onDelete(user)}
        >
          <Trash2 />
        </IconButton>
      ) : null}
    </HStack>
  );
}

function UserCard({
  user,
  rowContext,
}: {
  user: PublicUser;
  rowContext: UserRowContext;
}) {
  return (
    <Card.Root variant="outline" borderRadius="l3" bg="bg.panel">
      <Card.Body p="4" gap="3">
        <Flex justify="space-between" align="center" gap="3">
          <HStack gap="3" minW="0">
            <UserAvatar user={user} />
            <Box minW="0">
              <Text fontWeight="700" truncate>
                <UserName user={user} sessionUserId={rowContext.sessionUserId} />
              </Text>
              <Text fontFamily="mono" fontSize="xs" color="fg.muted" truncate>
                {user.username}
              </Text>
            </Box>
          </HStack>
          {rowContext.canChooseRole ? <RoleBadge role={user.role} /> : null}
        </Flex>
        <Flex justify="space-between" align="center" gap="3">
          <UserStatusControl user={user} rowContext={rowContext} />
          <UserActions user={user} rowContext={rowContext} />
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
