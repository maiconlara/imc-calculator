"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ListUsersFilters } from "@imc-calculator/shared";
import { userQueries } from "@/queries";

export function useGetUsers(filters: ListUsersFilters) {
  return useQuery({
    ...userQueries.getUsers(filters),
    placeholderData: keepPreviousData,
  });
}
