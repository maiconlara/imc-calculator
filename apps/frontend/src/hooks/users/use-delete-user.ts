"use client";

import { useMutation } from "@tanstack/react-query";
import { deleteUser } from "@/services";
import { useInvalidateUsersAndAssessments } from "../use-invalidate-users-and-assessments";

export function useDeleteUser() {
  const invalidateUsersAndAssessments = useInvalidateUsersAndAssessments();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: invalidateUsersAndAssessments,
  });
}
