import type {
  AssessmentSummary,
  CreateAssessmentData,
  ListAssessmentsFilters,
  Paginated,
  PublicAssessment,
  UpdateAssessmentData,
} from "@imc-calculator/shared";
import { proxiedBackendApi, type RequestOptions } from "./api";

export async function getAssessments(
  filters: ListAssessmentsFilters,
  options: RequestOptions = {},
): Promise<Paginated<PublicAssessment>> {
  const { data: assessmentsPage } = await (
    options.directBackendApi ?? proxiedBackendApi
  ).get<Paginated<PublicAssessment>>("/assessments", {
    params: filters,
    signal: options.signal,
  });
  return assessmentsPage;
}

export async function getAssessmentSummary(
  studentId: string | undefined,
  options: RequestOptions = {},
): Promise<AssessmentSummary> {
  const { data: assessmentSummary } = await (
    options.directBackendApi ?? proxiedBackendApi
  ).get<AssessmentSummary>("/assessments/summary", {
    params: { studentId },
    signal: options.signal,
  });
  return assessmentSummary;
}

export async function createAssessment(
  newAssessment: CreateAssessmentData,
): Promise<PublicAssessment> {
  const { data: createdAssessment } = await proxiedBackendApi.post<PublicAssessment>(
    "/assessments",
    newAssessment,
  );
  return createdAssessment;
}

export async function updateAssessment(
  assessmentId: string,
  measures: UpdateAssessmentData,
): Promise<PublicAssessment> {
  const { data: updatedAssessment } = await proxiedBackendApi.put<PublicAssessment>(
    `/assessments/${assessmentId}`,
    measures,
  );
  return updatedAssessment;
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await proxiedBackendApi.delete(`/assessments/${assessmentId}`);
}
