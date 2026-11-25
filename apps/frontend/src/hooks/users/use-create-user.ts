"use client";

import { useMutation } from "@tanstack/react-query";
import { createUser } from "@/services";
import { useInvalidateUsersAndAssessments } from "../use-invalidate-users-and-assessments";

export function useCreateUser() {
  const invalidateUsersAndAssessments = useInvalidateUsersAndAssessments();

  return useMutation({
    mutationFn: createUser,
    onSuccess: invalidateUsersAndAssessments,
  });
}
