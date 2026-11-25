import type { ProgressPoint, PublicAssessment } from "@imc-calculator/shared";
import type { Assessment, AssessmentDetails } from "./assessment";

export function toPublicAssessment(assessment: AssessmentDetails): PublicAssessment {
  return {
    id: assessment.id,
    height: assessment.height,
    weight: assessment.weight,
    bmi: assessment.bmi,
    classification: assessment.classification,
    createdAt: assessment.createdAt.toISOString(),
    student: assessment.student,
    assessor: assessment.assessor,
  };
}

export function toProgressPoint(assessment: Assessment): ProgressPoint {
  return {
    id: assessment.id,
    createdAt: assessment.createdAt.toISOString(),
    height: assessment.height,
    weight: assessment.weight,
    bmi: assessment.bmi,
    classification: assessment.classification,
  };
}
