"use client";

import { SearchX } from "lucide-react";
import type { PublicAssessment } from "@imc-calculator/shared";
import { AssessmentFormDialog, getAssessmentsEmptyState } from "@/components/assessments";
import { DataTable } from "@/components/ui/data-table";
import { useDialogTarget, useGetAssessments, useSessionUser } from "@/hooks";
import { INITIAL_ASSESSMENTS_FILTERS } from "@/lib/initial-filters";
import { permissions } from "@/lib/permissions";
import { AssessmentCard } from "./assessment-card";
import { AssessmentsFilterBar } from "./assessments-filter-bar";
import type { AssessmentRowContext } from "./assessments-view.types";
import { DeleteAssessmentDialog } from "./delete-assessment-dialog";
import { getAssessmentColumns } from "./get-assessment-columns";
import { StudentProgressPanel } from "./student-progress-panel";
import { useConfirmAssessmentDeletion } from "./use-confirm-assessment-deletion";
import { useFilterAssessments } from "./use-filter-assessments";

const ASSESSMENT_NOUN = { singular: "avaliação", plural: "avaliações" };

export function AssessmentsView() {
  const sessionUser = useSessionUser();

  const assessmentsFilters = useFilterAssessments();
  const assessmentsQuery = useGetAssessments(assessmentsFilters.listAssessmentsFilters);
  const assessmentEditDialog = useDialogTarget<PublicAssessment>();
  const assessmentDeletion = useConfirmAssessmentDeletion({
    prepareAssessmentRemoval: () =>
      assessmentsFilters.prepareRowRemoval(assessmentsQuery.data?.items.length ?? 0),
  });

  const rowContext: AssessmentRowContext = {
    seesSeveralStudents: permissions.canPerform(
      sessionUser.role,
      "filterAssessmentsByStudent",
    ),
    canEditAssessments: permissions.canPerform(sessionUser.role, "editAssessments"),
    canDeleteAssessments: permissions.canPerform(sessionUser.role, "deleteAssessments"),
    onEdit: assessmentEditDialog.open,
    onDelete: assessmentDeletion.askToDeleteAssessment,
  };

  return (
    <>
      <AssessmentsFilterBar
        selectedStudentId={assessmentsFilters.selectedStudentId}
        selectedTeacherId={assessmentsFilters.selectedTeacherId}
        selectedClassification={assessmentsFilters.selectedClassification}
        activeFilterCount={assessmentsFilters.activeFilterCount}
        onStudentChange={assessmentsFilters.changeSelectedStudent}
        onTeacherChange={assessmentsFilters.changeSelectedTeacher}
        onClassificationChange={assessmentsFilters.changeSelectedClassification}
        onClear={assessmentsFilters.clearFilters}
      />

      {assessmentsFilters.selectedStudentId ? (
        <StudentProgressPanel studentId={assessmentsFilters.selectedStudentId} />
      ) : null}

      <DataTable
        rows={assessmentsQuery.data?.items ?? []}
        columns={getAssessmentColumns(rowContext)}
        getRowKey={(assessment) => assessment.id}
        renderCard={(assessment) => (
          <AssessmentCard assessment={assessment} rowContext={rowContext} />
        )}
        isLoading={assessmentsQuery.isPending}
        isRefreshing={assessmentsQuery.isPlaceholderData}
        loadError={assessmentsQuery.error}
        onRetry={() => void assessmentsQuery.refetch()}
        emptyState={getAssessmentsEmptyState(sessionUser.role)}
        filteredEmptyState={{
          icon: SearchX,
          title: "Nenhuma avaliação com esses filtros",
          description: "Nenhuma avaliação corresponde aos filtros escolhidos.",
        }}
        hasActiveFilters={assessmentsFilters.activeFilterCount > 0}
        onClearFilters={assessmentsFilters.clearFilters}
        pagination={{
          page: assessmentsFilters.page,
          pageSize: INITIAL_ASSESSMENTS_FILTERS.pageSize,
          total: assessmentsQuery.data?.total ?? 0,
          onPageChange: assessmentsFilters.setPage,
        }}
        itemNoun={ASSESSMENT_NOUN}
      />

      <AssessmentFormDialog
        open={assessmentEditDialog.isOpen}
        onOpenChange={assessmentEditDialog.onOpenChange}
        assessmentToEdit={assessmentEditDialog.target}
      />

      <DeleteAssessmentDialog
        assessmentToDelete={assessmentDeletion.assessmentToDelete}
        open={assessmentDeletion.isDeleteDialogOpen}
        onOpenChange={assessmentDeletion.onDeleteDialogOpenChange}
        onConfirm={assessmentDeletion.confirmAssessmentDeletion}
        isPending={assessmentDeletion.isDeletingAssessment}
      />
    </>
  );
}
