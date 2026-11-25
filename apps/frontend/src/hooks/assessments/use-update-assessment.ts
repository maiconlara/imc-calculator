"use client";

import { useMutation } from "@tanstack/react-query";
import type { UpdateAssessmentData } from "@imc-calculator/shared";
import { updateAssessment } from "@/services";
import { useInvalidateUsersAndAssessments } from "../use-invalidate-users-and-assessments";

export function useUpdateAssessment() {
  const invalidateUsersAndAssessments = useInvalidateUsersAndAssessments();

  return useMutation({
    mutationFn: ({
      assessmentId,
      measures,
    }: {
      assessmentId: string;
      measures: UpdateAssessmentData;
    }) => updateAssessment(assessmentId, measures),
    onSuccess: invalidateUsersAndAssessments,
  });
}
