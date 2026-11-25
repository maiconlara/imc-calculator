"use client";

import { useState } from "react";
import type { ListUsersFilters, Role, UserStatus } from "@imc-calculator/shared";
import { useDebounce, useListPagination } from "@/hooks";
import { INITIAL_USERS_FILTERS } from "@/lib/initial-filters";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Search, role, status and page of the users list. Any filter change goes back to the
 * first page, and the search only reaches the query after the user stops typing.
 *
 * @returns The values shown in the filter bar, the filters the list is fetched with,
 * and the functions that change them.
 */
export function useFilterUsers() {
  const [searchText, setSearchText] = useState("");
  const typedSearchText = searchText.trim();
  const debouncedSearchText = useDebounce(typedSearchText, SEARCH_DEBOUNCE_MS);
  const [selectedRole, setSelectedRole] = useState<Role>();
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>();
  const { page, setPage, applyFilters, prepareRowRemoval } = useListPagination(
    INITIAL_USERS_FILTERS.page,
  );

  const listUsersFilters: ListUsersFilters = {
    ...INITIAL_USERS_FILTERS,
    page,
    search: debouncedSearchText || undefined,
    role: selectedRole,
    status: selectedStatus,
  };

  return {
    searchText,
    selectedRole,
    selectedStatus,
    page,
    setPage,
    prepareRowRemoval,
    listUsersFilters,
    isSearchPending: typedSearchText !== debouncedSearchText,
    activeFilterCount: [typedSearchText, selectedRole, selectedStatus].filter(Boolean)
      .length,
    hasQueriedFilters: [debouncedSearchText, selectedRole, selectedStatus].some(Boolean),
    changeSearchText: (typedText: string) => applyFilters(() => setSearchText(typedText)),
    changeSelectedRole: (role: Role | undefined) =>
      applyFilters(() => setSelectedRole(role)),
    changeSelectedStatus: (status: UserStatus | undefined) =>
      applyFilters(() => setSelectedStatus(status)),
    clearFilters: () =>
      applyFilters(() => {
        setSearchText("");
        setSelectedRole(undefined);
        setSelectedStatus(undefined);
      }),
  };
}
