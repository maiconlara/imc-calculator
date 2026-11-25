"use client";

import { useQueryClient } from "@tanstack/react-query";
import { assessmentQueryKeys, userQueryKeys } from "@/queries";

/**
 * Invalidates users and assessments together: a user rename shows up in the
 * assessment list and a new assessment changes the "has assessments" flag.
 *
 * @returns A function that refetches every active list.
 */
export function useInvalidateUsersAndAssessments() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: assessmentQueryKeys.all }),
    ]);
}
