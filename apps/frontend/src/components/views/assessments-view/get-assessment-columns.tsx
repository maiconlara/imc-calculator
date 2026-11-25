import { Text } from "@chakra-ui/react";
import type { PublicAssessment } from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import type { TableColumn } from "@/components/ui/data-table";
import { formatBmi, formatDateTime, formatHeight, formatWeight } from "@/lib/formatters";
import { AssessmentRowActions } from "./assessment-row-actions";
import type { AssessmentRowContext } from "./assessments-view.types";

/**
 * Columns of the assessments table. The student column shows only to roles that see
 * several students, and the actions column only to roles that may edit or delete.
 *
 * @param rowContext - Handlers and permissions of the list.
 * @returns The columns, in the order they show.
 */
export function getAssessmentColumns(
  rowContext: AssessmentRowContext,
): TableColumn<PublicAssessment>[] {
  const hasRowActions = rowContext.canEditAssessments || rowContext.canDeleteAssessments;

  return [
    {
      id: "date",
      header: "Data",
      renderCell: (assessment) => (
        <Text fontFamily="mono" fontSize="xs" color="fg.muted" whiteSpace="nowrap">
          {formatDateTime(assessment.createdAt)}
        </Text>
      ),
    },
    ...(rowContext.seesSeveralStudents
      ? [
          {
            id: "student",
            header: "Aluno",
            renderCell: (assessment: PublicAssessment) => (
              <Text fontWeight="600" whiteSpace="nowrap">
                {assessment.student.name}
              </Text>
            ),
          },
        ]
      : []),
    {
      id: "assessor",
      header: "Avaliado por",
      hideBelow: "md",
      renderCell: (assessment) => (
        <Text whiteSpace="nowrap">{assessment.assessor.name}</Text>
      ),
    },
    {
      id: "height",
      header: "Altura",
      align: "end",
      hideBelow: "xl",
      renderCell: (assessment) => formatHeight(assessment.height),
    },
    {
      id: "weight",
      header: "Peso",
      align: "end",
      hideBelow: "sm",
      renderCell: (assessment) => (
        <Text whiteSpace="nowrap">{formatWeight(assessment.weight)}</Text>
      ),
    },
    {
      id: "bmi",
      header: "IMC",
      align: "end",
      renderCell: (assessment) => (
        <Text fontFamily="heading" fontWeight="800" fontSize="md">
          {formatBmi(assessment.bmi)}
        </Text>
      ),
    },
    {
      id: "classification",
      header: "Classificação",
      renderCell: (assessment) => (
        <ClassificationBadge classification={assessment.classification} />
      ),
    },
    ...(hasRowActions
      ? [
          {
            id: "actions",
            header: "Ações",
            align: "end" as const,
            width: "1%",
            renderCell: (assessment: PublicAssessment) => (
              <AssessmentRowActions assessment={assessment} rowContext={rowContext} />
            ),
          },
        ]
      : []),
  ];
}
