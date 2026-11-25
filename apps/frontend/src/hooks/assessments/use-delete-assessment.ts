"use client";

import { useMutation } from "@tanstack/react-query";
import { deleteAssessment } from "@/services";
import { useInvalidateUsersAndAssessments } from "../use-invalidate-users-and-assessments";

export function useDeleteAssessment() {
  const invalidateUsersAndAssessments = useInvalidateUsersAndAssessments();

  return useMutation({
    mutationFn: deleteAssessment,
    onSuccess: invalidateUsersAndAssessments,
  });
}
