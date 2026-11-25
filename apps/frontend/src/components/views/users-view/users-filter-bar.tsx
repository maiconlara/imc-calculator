"use client";

import {
  ROLE_LABELS,
  USER_SEARCH_MAX_LENGTH,
  USER_STATUSES,
  USER_STATUS_LABELS,
  type Role,
  type UserStatus,
} from "@imc-calculator/shared";
import { FilterBar, FilterSelect, type FilterOption } from "@/components/ui/filter-bar";
import { useSessionUser } from "@/hooks";
import { permissions } from "@/lib/permissions";

const STATUS_FILTER_OPTIONS: readonly FilterOption<UserStatus>[] = USER_STATUSES.map(
  (status) => ({ value: status, label: USER_STATUS_LABELS[status] }),
);

interface UsersFilterBarProps {
  searchText: string;
  selectedRole: Role | undefined;
  selectedStatus: UserStatus | undefined;
  activeFilterCount: number;
  onSearchTextChange: (typedText: string) => void;
  onRoleChange: (role: Role | undefined) => void;
  onStatusChange: (status: UserStatus | undefined) => void;
  onClear: () => void;
}

/**
 * Search box and filters of the users list. The role filter only shows when the
 * signed in user may choose roles, so a teacher never asks for another role.
 */
export function UsersFilterBar({
  searchText,
  selectedRole,
  selectedStatus,
  activeFilterCount,
  onSearchTextChange,
  onRoleChange,
  onStatusChange,
  onClear,
}: UsersFilterBarProps) {
  const sessionUser = useSessionUser();
  const roleFilterOptions: readonly FilterOption<Role>[] = permissions
    .getManageableRoles(sessionUser.role)
    .map((role) => ({ value: role, label: ROLE_LABELS[role] }));

  return (
    <FilterBar
      search={{
        value: searchText,
        onChange: onSearchTextChange,
        placeholder: "Nome ou usuário",
        maxLength: USER_SEARCH_MAX_LENGTH,
      }}
      activeFilterCount={activeFilterCount}
      onClear={onClear}
    >
      {permissions.canChooseUserRole(sessionUser.role) ? (
        <FilterSelect
          label="Perfil"
          value={selectedRole}
          onChange={onRoleChange}
          options={roleFilterOptions}
        />
      ) : null}
      <FilterSelect
        label="Situação"
        value={selectedStatus}
        onChange={onStatusChange}
        options={STATUS_FILTER_OPTIONS}
        allOptionLabel="Todas"
      />
    </FilterBar>
  );
}
