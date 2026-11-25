"use client";

import {
  BMI_CLASSIFICATIONS,
  BMI_CLASSIFICATION_LABELS,
  type BmiClassification,
} from "@imc-calculator/shared";
import { FilterBar, FilterSelect, type FilterOption } from "@/components/ui/filter-bar";
import { useSessionUser } from "@/hooks";
import {
  ASSESSED_STUDENT_OPTIONS_FILTERS,
  TEACHER_OPTIONS_FILTERS,
} from "@/lib/initial-filters";
import { permissions } from "@/lib/permissions";
import { PersonFilter } from "./person-filter";

const CLASSIFICATION_FILTER_OPTIONS: readonly FilterOption<BmiClassification>[] =
  BMI_CLASSIFICATIONS.map((classification) => ({
    value: classification,
    label: BMI_CLASSIFICATION_LABELS[classification],
  }));

interface AssessmentsFilterBarProps {
  selectedStudentId: string | undefined;
  selectedTeacherId: string | undefined;
  selectedClassification: BmiClassification | undefined;
  activeFilterCount: number;
  onStudentChange: (studentId: string | undefined) => void;
  onTeacherChange: (teacherId: string | undefined) => void;
  onClassificationChange: (classification: BmiClassification | undefined) => void;
  onClear: () => void;
}

/**
 * Filters of the assessments list. The student and teacher filters only mount for
 * the roles that may use them, so their people lists never load for a role the API
 * would refuse.
 */
export function AssessmentsFilterBar({
  selectedStudentId,
  selectedTeacherId,
  selectedClassification,
  activeFilterCount,
  onStudentChange,
  onTeacherChange,
  onClassificationChange,
  onClear,
}: AssessmentsFilterBarProps) {
  const sessionUser = useSessionUser();

  return (
    <FilterBar activeFilterCount={activeFilterCount} onClear={onClear}>
      {permissions.canPerform(sessionUser.role, "filterAssessmentsByStudent") ? (
        <PersonFilter
          label="Aluno"
          mdWidth="72"
          userOptionsFilters={ASSESSED_STUDENT_OPTIONS_FILTERS}
          value={selectedStudentId}
          onChange={onStudentChange}
          placeholder="Todos os alunos"
          emptyMessage="Nenhum aluno avaliado ainda."
        />
      ) : null}
      {permissions.canPerform(sessionUser.role, "filterAssessmentsByTeacher") ? (
        <PersonFilter
          label="Professor"
          mdWidth="60"
          userOptionsFilters={TEACHER_OPTIONS_FILTERS}
          value={selectedTeacherId}
          onChange={onTeacherChange}
          placeholder="Todos os professores"
          emptyMessage="Nenhum professor cadastrado."
        />
      ) : null}
      <FilterSelect
        label="Classificação"
        value={selectedClassification}
        onChange={onClassificationChange}
        options={CLASSIFICATION_FILTER_OPTIONS}
        allOptionLabel="Todas"
      />
    </FilterBar>
  );
}
