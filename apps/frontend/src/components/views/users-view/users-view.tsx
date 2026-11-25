"use client";

import { SearchX, Users } from "lucide-react";
import type { PublicUser } from "@imc-calculator/shared";
import { DataTable } from "@/components/ui/data-table";
import { useDialogTarget, useGetUsers, useSessionUser } from "@/hooks";
import { INITIAL_USERS_FILTERS } from "@/lib/initial-filters";
import { permissions } from "@/lib/permissions";
import { getManagedUserNoun } from "@/lib/screen-titles";
import { getUserColumns } from "./get-user-columns";
import { NewUserButton } from "./new-user-button";
import { useConfirmUserActions } from "./use-confirm-user-actions";
import { useFilterUsers } from "./use-filter-users";
import { UserCard } from "./user-card";
import { UserConfirmDialog } from "./user-confirm-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { UsersFilterBar } from "./users-filter-bar";
import type { UserRowContext } from "./users-view.types";

export function UsersView() {
  const sessionUser = useSessionUser();
  const managedUserNoun = getManagedUserNoun(sessionUser.role);
  const canManageUsers = permissions.canPerform(sessionUser.role, "manageUsers");

  const usersFilters = useFilterUsers();
  const usersQuery = useGetUsers(usersFilters.listUsersFilters);
  const userEditDialog = useDialogTarget<PublicUser>();
  const userActions = useConfirmUserActions({
    prepareUserRemoval: () =>
      usersFilters.prepareRowRemoval(usersQuery.data?.items.length ?? 0),
  });

  const rowContext: UserRowContext = {
    sessionUserId: sessionUser.id,
    canChooseRole: permissions.canChooseUserRole(sessionUser.role),
    canManageUsers,
    canDeleteUsers: permissions.canPerform(sessionUser.role, "deleteUsers"),
    statusChangingUserId: userActions.statusChangingUserId,
    onEdit: userEditDialog.open,
    onActivate: userActions.activateUser,
    onDeactivate: userActions.askToDeactivateUser,
    onDelete: userActions.askToDeleteUser,
  };

  return (
    <>
      <UsersFilterBar
        searchText={usersFilters.searchText}
        selectedRole={usersFilters.selectedRole}
        selectedStatus={usersFilters.selectedStatus}
        activeFilterCount={usersFilters.activeFilterCount}
        onSearchTextChange={usersFilters.changeSearchText}
        onRoleChange={usersFilters.changeSelectedRole}
        onStatusChange={usersFilters.changeSelectedStatus}
        onClear={usersFilters.clearFilters}
      />

      <DataTable
        rows={usersQuery.data?.items ?? []}
        columns={getUserColumns(rowContext)}
        getRowKey={(user) => user.id}
        renderCard={(user) => <UserCard user={user} rowContext={rowContext} />}
        isLoading={usersQuery.isPending}
        isRefreshing={usersQuery.isPlaceholderData || usersFilters.isSearchPending}
        loadError={usersQuery.error}
        onRetry={() => void usersQuery.refetch()}
        emptyState={{
          icon: Users,
          title: `Nenhum ${managedUserNoun.singular} cadastrado ainda`,
          description: `Cadastre o primeiro ${managedUserNoun.singular} para começar.`,
          action: canManageUsers ? <NewUserButton /> : null,
        }}
        filteredEmptyState={{
          icon: SearchX,
          title: "Ninguém encontrado",
          description: "Nenhum cadastro corresponde à busca e aos filtros escolhidos.",
        }}
        hasActiveFilters={usersFilters.hasQueriedFilters}
        onClearFilters={usersFilters.clearFilters}
        pagination={{
          page: usersFilters.page,
          pageSize: INITIAL_USERS_FILTERS.pageSize,
          total: usersQuery.data?.total ?? 0,
          onPageChange: usersFilters.setPage,
        }}
        itemNoun={managedUserNoun}
      />

      <UserFormDialog
        open={userEditDialog.isOpen}
        onOpenChange={userEditDialog.onOpenChange}
        userToEdit={userEditDialog.target}
      />

      {userActions.confirmation ? (
        <UserConfirmDialog
          confirmation={userActions.confirmation}
          open={userActions.isConfirmDialogOpen}
          onOpenChange={userActions.onConfirmDialogOpenChange}
          onConfirm={userActions.confirmPendingAction}
          isPending={userActions.isUserChangePending}
        />
      ) : null}
    </>
  );
}
