"use client";

import { useMutation } from "@tanstack/react-query";
import type { UpdateUserInput } from "@imc-calculator/shared";
import { updateUser } from "@/services";
import { useInvalidateUsersAndAssessments } from "../use-invalidate-users-and-assessments";

export function useUpdateUser() {
  const invalidateUsersAndAssessments = useInvalidateUsersAndAssessments();

  return useMutation({
    mutationFn: ({
      userId,
      userChanges,
    }: {
      userId: string;
      userChanges: UpdateUserInput;
    }) => updateUser(userId, userChanges),
    onSuccess: invalidateUsersAndAssessments,
  });
}
