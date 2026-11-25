import type {
  BmiClassification,
  ClassificationCount,
  PersonSummary,
} from "@imc-calculator/shared";

export interface Assessment {
  id: string;
  height: number;
  weight: number;
  bmi: number;
  classification: BmiClassification;
  assessorId: string;
  studentId: string;
  createdAt: Date;
}

export interface AssessmentDetails extends Assessment {
  student: PersonSummary;
  assessor: PersonSummary;
}

export type NewAssessment = Omit<Assessment, "id">;

export type AssessmentMeasures = Pick<
  Assessment,
  "height" | "weight" | "bmi" | "classification"
>;

/**
 * Filters applied to every assessment query, already limited to what the signed in
 * user may see.
 */
export interface AssessmentScope {
  studentId?: string;
  assessorId?: string;
  responsibleTeacherId?: string;
  classification?: BmiClassification;
}

export interface AssessmentTotals {
  totalAssessments: number;
  assessmentsThisMonth: number;
  assessedStudents: number;
  currentBmiSum: number;
  distribution: ClassificationCount[];
}
