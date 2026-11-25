"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ListAssessmentsFilters } from "@imc-calculator/shared";
import { assessmentQueries } from "@/queries";

export function useGetAssessments(filters: ListAssessmentsFilters) {
  return useQuery({
    ...assessmentQueries.getAssessments(filters),
    placeholderData: keepPreviousData,
  });
}
