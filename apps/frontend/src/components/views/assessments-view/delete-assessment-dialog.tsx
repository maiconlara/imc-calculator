import type { PublicAssessment } from "@imc-calculator/shared";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatBmi, formatDateTime } from "@/lib/formatters";

interface DeleteAssessmentDialogProps {
  assessmentToDelete: PublicAssessment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Confirmation asked before an assessment leaves the history for good.
 *
 * @param props - The assessment waiting for confirmation and the dialog state.
 */
export function DeleteAssessmentDialog({
  assessmentToDelete,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteAssessmentDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Excluir avaliação?"
      description={
        assessmentToDelete
          ? `A avaliação de ${assessmentToDelete.student.name} em ${formatDateTime(assessmentToDelete.createdAt)} (IMC ${formatBmi(assessmentToDelete.bmi)}) sai do histórico. Não dá para desfazer.`
          : undefined
      }
      confirmLabel="Excluir"
      isPending={isPending}
    />
  );
}
