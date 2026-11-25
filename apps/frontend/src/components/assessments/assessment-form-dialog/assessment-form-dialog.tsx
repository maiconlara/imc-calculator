"use client";

import type { PublicAssessment } from "@imc-calculator/shared";
import { FormDialog } from "@/components/ui/form-dialog";
import { AssessmentForm } from "./assessment-form";

interface AssessmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentToEdit: PublicAssessment | null;
}

/**
 * Records an assessment, or fixes the measures of `assessmentToEdit` when given, with
 * the same form.
 */
export function AssessmentFormDialog({
  open,
  onOpenChange,
  assessmentToEdit,
}: AssessmentFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={assessmentToEdit ? "Editar avaliação" : "Nova avaliação"}
      description={
        assessmentToEdit
          ? "Corrija a altura ou o peso. O IMC é calculado de novo."
          : "O IMC e a classificação saem da altura e do peso."
      }
    >
      <AssessmentForm
        assessmentToEdit={assessmentToEdit}
        onSaved={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}
