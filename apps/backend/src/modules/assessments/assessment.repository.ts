import type { Pagination } from "@imc-calculator/shared";
import type {
  Assessment,
  AssessmentDetails,
  AssessmentMeasures,
  AssessmentScope,
  AssessmentTotals,
  NewAssessment,
} from "./assessment";

export interface AssessmentRepository {
  create(newAssessment: NewAssessment): Promise<string>;
  updateMeasures(assessmentId: string, measures: AssessmentMeasures): Promise<void>;
  delete(assessmentId: string): Promise<void>;
  findById(
    assessmentId: string,
    visibleScope: AssessmentScope,
  ): Promise<AssessmentDetails | null>;
  listPaginated(
    visibleScope: AssessmentScope,
    pagination: Pagination,
  ): Promise<{ assessments: AssessmentDetails[]; total: number }>;
  /**
   * Aggregates the assessments in scope. The student count, the classification
   * breakdown and the BMI sum only use the latest assessment of each active student,
   * while the assessment counters include the whole history.
   *
   * @param visibleScope - Filters already restricted to what the user may see.
   * @param monthStart - Start of the current month, for the monthly counter.
   * @returns Totals used by the dashboard.
   */
  calculateTotals(
    visibleScope: AssessmentScope,
    monthStart: Date,
  ): Promise<AssessmentTotals>;
  listOldestFirst(visibleScope: AssessmentScope): Promise<Assessment[]>;
}
