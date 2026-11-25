"use client";

import { useState } from "react";
import type { BmiClassification, ListAssessmentsFilters } from "@imc-calculator/shared";
import { useListPagination } from "@/hooks";
import { INITIAL_ASSESSMENTS_FILTERS } from "@/lib/initial-filters";

/**
 * Student, teacher, classification and page of the assessments list. Any filter change
 * goes back to the first page.
 *
 * @returns The values shown in the filter bar, the filters the list is fetched with,
 * and the functions that change them.
 */
export function useFilterAssessments() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>();
  const [selectedClassification, setSelectedClassification] =
    useState<BmiClassification>();
  const { page, setPage, applyFilters, prepareRowRemoval } = useListPagination(
    INITIAL_ASSESSMENTS_FILTERS.page,
  );

  const listAssessmentsFilters: ListAssessmentsFilters = {
    ...INITIAL_ASSESSMENTS_FILTERS,
    page,
    studentId: selectedStudentId,
    assessorId: selectedTeacherId,
    classification: selectedClassification,
  };

  return {
    selectedStudentId,
    selectedTeacherId,
    selectedClassification,
    page,
    setPage,
    prepareRowRemoval,
    listAssessmentsFilters,
    activeFilterCount: [
      selectedStudentId,
      selectedTeacherId,
      selectedClassification,
    ].filter(Boolean).length,
    changeSelectedStudent: (studentId: string | undefined) =>
      applyFilters(() => setSelectedStudentId(studentId)),
    changeSelectedTeacher: (teacherId: string | undefined) =>
      applyFilters(() => setSelectedTeacherId(teacherId)),
    changeSelectedClassification: (classification: BmiClassification | undefined) =>
      applyFilters(() => setSelectedClassification(classification)),
    clearFilters: () =>
      applyFilters(() => {
        setSelectedStudentId(undefined);
        setSelectedTeacherId(undefined);
        setSelectedClassification(undefined);
      }),
  };
}
