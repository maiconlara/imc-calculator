import type { BmiClassification } from "@imc-calculator/shared";

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
