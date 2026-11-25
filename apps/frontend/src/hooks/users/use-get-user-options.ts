"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserOptionsFilters } from "@imc-calculator/shared";
import { userQueries } from "@/queries";

export function useGetUserOptions(filters: UserOptionsFilters) {
  return useQuery(userQueries.getUserOptions(filters));
}
