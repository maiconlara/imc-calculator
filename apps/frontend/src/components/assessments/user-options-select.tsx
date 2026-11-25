"use client";

import type { ComponentProps } from "react";
import type { UserOptionsFilters } from "@imc-calculator/shared";
import { PersonSelect } from "@/components/ui/person-select";
import { useGetUserOptions } from "@/hooks";

type UserOptionsSelectProps = Omit<
  ComponentProps<typeof PersonSelect>,
  "people" | "isLoading" | "loadError" | "onRetry"
> & {
  userOptionsFilters: UserOptionsFilters;
};

/**
 * `PersonSelect` filled with the people `/users/options` returns for the given filters,
 * with the loading, the error and the retry of that request.
 *
 * @param props - Filters of the people to list and the props of the picker.
 */
export function UserOptionsSelect({
  userOptionsFilters,
  ...personSelectProps
}: UserOptionsSelectProps) {
  const userOptionsQuery = useGetUserOptions(userOptionsFilters);
  return (
    <PersonSelect
      {...personSelectProps}
      people={userOptionsQuery.data ?? []}
      isLoading={userOptionsQuery.isPending}
      loadError={userOptionsQuery.error}
      onRetry={() => void userOptionsQuery.refetch()}
    />
  );
}
