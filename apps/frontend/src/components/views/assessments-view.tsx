"use client";

import { useState } from "react";
import { Box, Card, Flex, HStack, IconButton, Skeleton, Text } from "@chakra-ui/react";
import { Pencil, SearchX, Trash2 } from "lucide-react";
import {
  BMI_CLASSIFICATIONS,
  BMI_CLASSIFICATION_LABELS,
  type BmiClassification,
  type PublicAssessment,
} from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { FilterBar, FilterSelect, type FilterOption } from "@/components/ui/filter-bar";
import { FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { PersonSelect } from "@/components/ui/person-select";
import { ProgressChart } from "@/components/ui/progress-chart";
import { LoadErrorMessage } from "@/components/ui/state-message";
import { notify } from "@/components/ui/toaster";
import {
  useDeleteAssessment,
  useGetAssessmentSummary,
  useGetAssessments,
  useGetUserOptions,
  useSessionUser,
} from "@/hooks";
import { getErrorMessage } from "@/lib/api-errors";
import { formatBmi, formatDateTime, formatHeight, formatWeight } from "@/lib/formatters";
import {
  ASSESSED_STUDENT_OPTIONS_FILTERS,
  INITIAL_ASSESSMENTS_FILTERS,
  TEACHER_OPTIONS_FILTERS,
} from "@/lib/initial-filters";
import { permissions } from "@/lib/permissions";
import { AssessmentFormDialog } from "./assessment-form-dialog";
import { getAssessmentsEmptyState } from "./assessments-empty-state";

const ASSESSMENT_NOUN = { singular: "avaliação", plural: "avaliações" };

const CLASSIFICATION_FILTER_OPTIONS: readonly FilterOption<BmiClassification>[] =
  BMI_CLASSIFICATIONS.map((classification) => ({
    value: classification,
    label: BMI_CLASSIFICATION_LABELS[classification],
  }));

interface AssessmentRowContext {
  seesSeveralStudents: boolean;
  canEditAssessments: boolean;
  canDeleteAssessments: boolean;
  onEdit: (assessment: PublicAssessment) => void;
  onDelete: (assessment: PublicAssessment) => void;
}

export function AssessmentsView() {
  const sessionUser = useSessionUser();
  const canFilterByStudent = permissions.canPerform(
    sessionUser.role,
    "filterAssessmentsByStudent",
  );
  const canFilterByTeacher = permissions.canPerform(
    sessionUser.role,
    "filterAssessmentsByTeacher",
  );

  const [page, setPage] = useState<number>(INITIAL_ASSESSMENTS_FILTERS.page);
  const [selectedStudentId, setSelectedStudentId] = useState<string>();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>();
  const [selectedClassification, setSelectedClassification] =
    useState<BmiClassification>();
  const [assessmentToEdit, setAssessmentToEdit] = useState<PublicAssessment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<PublicAssessment | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const assessmentsQuery = useGetAssessments({
    ...INITIAL_ASSESSMENTS_FILTERS,
    page,
    studentId: selectedStudentId,
    assessorId: selectedTeacherId,
    classification: selectedClassification,
  });
  const deleteAssessment = useDeleteAssessment();
  const activeFilterCount = [
    selectedStudentId,
    selectedTeacherId,
    selectedClassification,
  ].filter(Boolean).length;

  function applyFilterAndResetPage(applyFilter: () => void) {
    applyFilter();
    setPage(1);
  }

  function clearFilters() {
    applyFilterAndResetPage(() => {
      setSelectedStudentId(undefined);
      setSelectedTeacherId(undefined);
      setSelectedClassification(undefined);
    });
  }

  function confirmAssessmentDeletion() {
    if (!assessmentToDelete) return;
    const isLastRowOfPage = assessmentsQuery.data?.items.length === 1 && page > 1;
    deleteAssessment.mutate(assessmentToDelete.id, {
      onSuccess: () => {
        notify.success("Avaliação excluída.");
        setIsDeleteDialogOpen(false);
        if (isLastRowOfPage) setPage(page - 1);
      },
      onError: (error) =>
        notify.error(getErrorMessage(error, "Não foi possível excluir a avaliação.")),
    });
  }

  const rowContext: AssessmentRowContext = {
    seesSeveralStudents: canFilterByStudent,
    canEditAssessments: permissions.canPerform(sessionUser.role, "editAssessments"),
    canDeleteAssessments: permissions.canPerform(sessionUser.role, "deleteAssessments"),
    onEdit: (assessment) => {
      setAssessmentToEdit(assessment);
      setIsEditDialogOpen(true);
    },
    onDelete: (assessment) => {
      setAssessmentToDelete(assessment);
      setIsDeleteDialogOpen(true);
    },
  };
  const hasRowActions = rowContext.canEditAssessments || rowContext.canDeleteAssessments;

  const assessmentColumns: TableColumn<PublicAssessment>[] = [
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
              <AssessmentActions assessment={assessment} rowContext={rowContext} />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <FilterBar activeFilterCount={activeFilterCount} onClear={clearFilters}>
        {canFilterByStudent ? (
          <StudentFilter
            value={selectedStudentId}
            onChange={(studentId) =>
              applyFilterAndResetPage(() => setSelectedStudentId(studentId))
            }
          />
        ) : null}
        {canFilterByTeacher ? (
          <TeacherFilter
            value={selectedTeacherId}
            onChange={(teacherId) =>
              applyFilterAndResetPage(() => setSelectedTeacherId(teacherId))
            }
          />
        ) : null}
        <FilterSelect
          label="Classificação"
          value={selectedClassification}
          onChange={(classification) =>
            applyFilterAndResetPage(() => setSelectedClassification(classification))
          }
          options={CLASSIFICATION_FILTER_OPTIONS}
          allOptionLabel="Todas"
        />
      </FilterBar>

      {selectedStudentId ? <StudentProgressPanel studentId={selectedStudentId} /> : null}

      <DataTable
        rows={assessmentsQuery.data?.items ?? []}
        columns={assessmentColumns}
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
        hasActiveFilters={activeFilterCount > 0}
        onClearFilters={clearFilters}
        pagination={{
          page,
          pageSize: INITIAL_ASSESSMENTS_FILTERS.pageSize,
          total: assessmentsQuery.data?.total ?? 0,
          onPageChange: setPage,
        }}
        itemNoun={ASSESSMENT_NOUN}
      />

      <AssessmentFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        assessmentToEdit={assessmentToEdit}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmAssessmentDeletion}
        title="Excluir avaliação?"
        description={
          assessmentToDelete
            ? `A avaliação de ${assessmentToDelete.student.name} em ${formatDateTime(assessmentToDelete.createdAt)} (IMC ${formatBmi(assessmentToDelete.bmi)}) sai do histórico. Não dá para desfazer.`
            : undefined
        }
        confirmLabel="Excluir"
        isPending={deleteAssessment.isPending}
      />
    </>
  );
}

function StudentFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (studentId: string | undefined) => void;
}) {
  const assessedStudentsQuery = useGetUserOptions(ASSESSED_STUDENT_OPTIONS_FILTERS);
  return (
    <Box w={{ base: "full", md: "72" }}>
      <FormField label="Aluno">
        <PersonSelect
          people={assessedStudentsQuery.data ?? []}
          value={value}
          onChange={onChange}
          placeholder="Todos os alunos"
          emptyMessage="Nenhum aluno avaliado ainda."
          isLoading={assessedStudentsQuery.isPending}
          loadError={assessedStudentsQuery.error}
          onRetry={() => void assessedStudentsQuery.refetch()}
          size="sm"
        />
      </FormField>
    </Box>
  );
}

function TeacherFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (teacherId: string | undefined) => void;
}) {
  const teachersQuery = useGetUserOptions(TEACHER_OPTIONS_FILTERS);
  return (
    <Box w={{ base: "full", md: "60" }}>
      <FormField label="Professor">
        <PersonSelect
          people={teachersQuery.data ?? []}
          value={value}
          onChange={onChange}
          placeholder="Todos os professores"
          emptyMessage="Nenhum professor cadastrado."
          isLoading={teachersQuery.isPending}
          loadError={teachersQuery.error}
          onRetry={() => void teachersQuery.refetch()}
          size="sm"
        />
      </FormField>
    </Box>
  );
}

function StudentProgressPanel({ studentId }: { studentId: string }) {
  const assessedStudentsQuery = useGetUserOptions(ASSESSED_STUDENT_OPTIONS_FILTERS);
  const studentSummaryQuery = useGetAssessmentSummary(studentId);
  const studentName = assessedStudentsQuery.data?.find(
    (student) => student.id === studentId,
  )?.name;

  return (
    <Box mb="5">
      <Panel
        title={studentName ? `Evolução de ${studentName}` : "Evolução do aluno"}
        description="Todas as avaliações deste aluno, da primeira à mais recente."
      >
        {studentSummaryQuery.error ? (
          <LoadErrorMessage
            title="Não foi possível carregar a evolução"
            loadError={studentSummaryQuery.error}
            onRetry={() => void studentSummaryQuery.refetch()}
          />
        ) : studentSummaryQuery.data ? (
          <ProgressChart progressPoints={studentSummaryQuery.data.progress ?? []} />
        ) : (
          <Skeleton h="64" borderRadius="l2" aria-label="Carregando a evolução" />
        )}
      </Panel>
    </Box>
  );
}

function AssessmentActions({
  assessment,
  rowContext,
}: {
  assessment: PublicAssessment;
  rowContext: AssessmentRowContext;
}) {
  return (
    <HStack gap="1" justify="end">
      {rowContext.canEditAssessments ? (
        <IconButton
          size="sm"
          variant="outline"
          aria-label={`Editar avaliação de ${assessment.student.name}`}
          title="Editar"
          onClick={() => rowContext.onEdit(assessment)}
        >
          <Pencil />
        </IconButton>
      ) : null}
      {rowContext.canDeleteAssessments ? (
        <IconButton
          size="sm"
          variant="outline"
          colorPalette="red"
          aria-label={`Excluir avaliação de ${assessment.student.name}`}
          title="Excluir"
          onClick={() => rowContext.onDelete(assessment)}
        >
          <Trash2 />
        </IconButton>
      ) : null}
    </HStack>
  );
}

function AssessmentCard({
  assessment,
  rowContext,
}: {
  assessment: PublicAssessment;
  rowContext: AssessmentRowContext;
}) {
  const assessedAt = formatDateTime(assessment.createdAt);
  return (
    <Card.Root variant="outline" borderRadius="l3" bg="bg.panel">
      <Card.Body p="4" gap="3">
        <Flex justify="space-between" align="start" gap="3">
          <Box minW="0">
            <Text fontWeight="700" truncate>
              {rowContext.seesSeveralStudents ? assessment.student.name : assessedAt}
            </Text>
            <Text fontSize="xs" color="fg.muted" truncate>
              {rowContext.seesSeveralStudents ? `${assessedAt} · ` : ""}
              por {assessment.assessor.name}
            </Text>
          </Box>
          <Box flexShrink={0} textAlign="end">
            <Text fontFamily="heading" fontWeight="900" fontSize="2xl" lineHeight="1">
              {formatBmi(assessment.bmi)}
            </Text>
            <Text mt="1" fontSize="xs" color="fg.muted" whiteSpace="nowrap">
              {formatHeight(assessment.height)} · {formatWeight(assessment.weight)}
            </Text>
          </Box>
        </Flex>
        <Flex justify="space-between" align="center" gap="3">
          <ClassificationBadge classification={assessment.classification} />
          <AssessmentActions assessment={assessment} rowContext={rowContext} />
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
