"use client";

import type { PublicAssessment } from "@imc-calculator/shared";
import { notify } from "@/components/ui/toaster";
import { useDeleteAssessment, useDialogTarget } from "@/hooks";
import { getErrorMessage } from "@/lib/api-errors";

interface ConfirmAssessmentDeletionOptions {
  prepareAssessmentRemoval: () => () => void;
}

/**
 * Deletion of an assessment from the list, after the confirmation dialog.
 *
 * @param options.prepareAssessmentRemoval - Runs right before the deletion; the
 * function it returns runs once the deletion succeeds.
 * @returns The state of the confirmation dialog, the function that asks for it and the
 * one that deletes the assessment once confirmed.
 */
export function useConfirmAssessmentDeletion({
  prepareAssessmentRemoval,
}: ConfirmAssessmentDeletionOptions) {
  const deleteAssessment = useDeleteAssessment();
  const deleteDialog = useDialogTarget<PublicAssessment>();

  function confirmAssessmentDeletion() {
    const assessmentToDelete = deleteDialog.target;
    if (!assessmentToDelete) return;
    const finishAssessmentRemoval = prepareAssessmentRemoval();
    deleteAssessment.mutate(assessmentToDelete.id, {
      onSuccess: () => {
        notify.success("Avaliação excluída.");
        deleteDialog.close();
        finishAssessmentRemoval();
      },
      onError: (error) =>
        notify.error(getErrorMessage(error, "Não foi possível excluir a avaliação.")),
    });
  }

  return {
    assessmentToDelete: deleteDialog.target,
    isDeleteDialogOpen: deleteDialog.isOpen,
    onDeleteDialogOpenChange: deleteDialog.onOpenChange,
    askToDeleteAssessment: deleteDialog.open,
    confirmAssessmentDeletion,
    isDeletingAssessment: deleteAssessment.isPending,
  };
}
