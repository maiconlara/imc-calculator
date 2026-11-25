import { queryOptions } from "@tanstack/react-query";
import type { ListAssessmentsFilters } from "@imc-calculator/shared";
import { getAssessmentSummary, getAssessments, type BackendApi } from "@/services";

export const assessmentQueryKeys = {
  all: ["assessments"] as const,
  assessments: (filters: ListAssessmentsFilters) =>
    ["assessments", "list", filters] as const,
  assessmentSummary: (studentId: string | undefined) =>
    ["assessments", "summary", studentId ?? "all"] as const,
};

export const assessmentQueries = {
  getAssessments: (filters: ListAssessmentsFilters, directBackendApi?: BackendApi) =>
    queryOptions({
      queryKey: assessmentQueryKeys.assessments(filters),
      queryFn: ({ signal }) => getAssessments(filters, { signal, directBackendApi }),
    }),
  getAssessmentSummary: (studentId: string | undefined, directBackendApi?: BackendApi) =>
    queryOptions({
      queryKey: assessmentQueryKeys.assessmentSummary(studentId),
      queryFn: ({ signal }) =>
        getAssessmentSummary(studentId, { signal, directBackendApi }),
    }),
};
