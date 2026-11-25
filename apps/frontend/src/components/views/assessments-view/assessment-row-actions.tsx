import { RowActions } from "@/components/ui/row-actions";
import type { AssessmentRowProps } from "./assessments-view.types";

/**
 * Edit and delete buttons of an assessment, shown in the table row and in the phone
 * card. Each button only shows when the role may use it.
 *
 * @param props - The assessment of the row and the handlers and permissions of the list.
 */
export function AssessmentRowActions({ assessment, rowContext }: AssessmentRowProps) {
  return (
    <RowActions
      editLabel={`Editar avaliação de ${assessment.student.name}`}
      deleteLabel={`Excluir avaliação de ${assessment.student.name}`}
      onEdit={
        rowContext.canEditAssessments ? () => rowContext.onEdit(assessment) : undefined
      }
      onDelete={
        rowContext.canDeleteAssessments
          ? () => rowContext.onDelete(assessment)
          : undefined
      }
    />
  );
}
