"use client";

import { useMutation } from "@tanstack/react-query";
import { createAssessment } from "@/services";
import { useInvalidateUsersAndAssessments } from "../use-invalidate-users-and-assessments";

export function useCreateAssessment() {
  const invalidateUsersAndAssessments = useInvalidateUsersAndAssessments();

  return useMutation({
    mutationFn: createAssessment,
    onSuccess: invalidateUsersAndAssessments,
  });
}
