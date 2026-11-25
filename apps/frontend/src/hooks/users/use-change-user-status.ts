"use client";

import { useMutation } from "@tanstack/react-query";
import type { UserStatus } from "@imc-calculator/shared";
import { changeUserStatus } from "@/services";
import { useInvalidateUsersAndAssessments } from "../use-invalidate-users-and-assessments";

export function useChangeUserStatus() {
  const invalidateUsersAndAssessments = useInvalidateUsersAndAssessments();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      changeUserStatus(userId, status),
    onSuccess: invalidateUsersAndAssessments,
  });
}
