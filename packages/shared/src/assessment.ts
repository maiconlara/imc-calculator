import { z } from "zod";
import { BMI_CLASSIFICATIONS, type BmiClassification } from "./bmi";
import { optionalParam, paginationSchema } from "./common";

export const MIN_HEIGHT = 0.5;
export const MAX_HEIGHT = 2.5;
export const MIN_WEIGHT = 10;
export const MAX_WEIGHT = 400;

const formatHeightLimit = (meters: number) =>
  meters.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatWeightLimit = (kilograms: number) =>
  kilograms.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export const heightSchema = z
  .number({ error: "Informe a altura em metros" })
  .min(MIN_HEIGHT, `A altura mínima é ${formatHeightLimit(MIN_HEIGHT)} m`)
  .max(MAX_HEIGHT, `A altura máxima é ${formatHeightLimit(MAX_HEIGHT)} m`);

export const weightSchema = z
  .number({ error: "Informe o peso em kg" })
  .min(MIN_WEIGHT, `O peso mínimo é ${formatWeightLimit(MIN_WEIGHT)} kg`)
  .max(MAX_WEIGHT, `O peso máximo é ${formatWeightLimit(MAX_WEIGHT)} kg`);

export const createAssessmentSchema = z.object({
  studentId: z.uuid({ error: "Selecione o aluno" }),
  height: heightSchema,
  weight: weightSchema,
});

export type CreateAssessmentData = z.output<typeof createAssessmentSchema>;

export const updateAssessmentSchema = z.object({
  height: heightSchema,
  weight: weightSchema,
});

export type UpdateAssessmentData = z.output<typeof updateAssessmentSchema>;

const studentFilterSchema = z.uuid({ error: "Aluno inválido" });

export const listAssessmentsQuerySchema = paginationSchema.extend({
  studentId: optionalParam(studentFilterSchema),
  assessorId: optionalParam(z.uuid({ error: "Professor inválido" })),
  classification: optionalParam(
    z.enum(BMI_CLASSIFICATIONS, { error: "Classificação inválida" }),
  ),
});

export type ListAssessmentsQuery = z.output<typeof listAssessmentsQuerySchema>;
export type ListAssessmentsFilters = Partial<ListAssessmentsQuery>;

export const assessmentSummaryQuerySchema = z.object({
  studentId: optionalParam(studentFilterSchema),
});

export type AssessmentSummaryQuery = z.output<typeof assessmentSummaryQuerySchema>;

export interface PersonSummary {
  id: string;
  name: string;
}

export interface PublicAssessment {
  id: string;
  height: number;
  weight: number;
  bmi: number;
  classification: BmiClassification;
  createdAt: string;
  student: PersonSummary;
  assessor: PersonSummary;
}

export interface ProgressPoint {
  id: string;
  createdAt: string;
  height: number;
  weight: number;
  bmi: number;
  classification: BmiClassification;
}

export interface ClassificationCount {
  classification: BmiClassification;
  total: number;
}

export interface AssessmentSummary {
  totalAssessments: number;
  assessmentsThisMonth: number;
  assessedStudents: number;
  activeStudents: number | null;
  averageBmi: number | null;
  distribution: ClassificationCount[];
  progress: ProgressPoint[] | null;
}
