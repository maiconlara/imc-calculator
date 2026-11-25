"use client";

import { useQuery } from "@tanstack/react-query";
import { assessmentQueries } from "@/queries";

export function useGetAssessmentSummary(studentId: string | undefined) {
  return useQuery(assessmentQueries.getAssessmentSummary(studentId));
}
