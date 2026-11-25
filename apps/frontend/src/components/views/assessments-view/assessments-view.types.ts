import type { PublicAssessment } from "@imc-calculator/shared";

export interface AssessmentRowContext {
  seesSeveralStudents: boolean;
  canEditAssessments: boolean;
  canDeleteAssessments: boolean;
  onEdit: (assessment: PublicAssessment) => void;
  onDelete: (assessment: PublicAssessment) => void;
}

export interface AssessmentRowProps {
  assessment: PublicAssessment;
  rowContext: AssessmentRowContext;
}
