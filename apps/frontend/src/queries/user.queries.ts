import { queryOptions } from "@tanstack/react-query";
import type { ListUsersFilters, UserOptionsFilters } from "@imc-calculator/shared";
import { getUserOptions, getUsers, type BackendApi } from "@/services";

export const userQueryKeys = {
  all: ["users"] as const,
  users: (filters: ListUsersFilters) => ["users", "list", filters] as const,
  userOptions: (filters: UserOptionsFilters) => ["users", "options", filters] as const,
};

export const userQueries = {
  getUsers: (filters: ListUsersFilters, directBackendApi?: BackendApi) =>
    queryOptions({
      queryKey: userQueryKeys.users(filters),
      queryFn: ({ signal }) => getUsers(filters, { signal, directBackendApi }),
    }),
  getUserOptions: (filters: UserOptionsFilters, directBackendApi?: BackendApi) =>
    queryOptions({
      queryKey: userQueryKeys.userOptions(filters),
      queryFn: ({ signal }) => getUserOptions(filters, { signal, directBackendApi }),
      staleTime: 60_000,
    }),
};
