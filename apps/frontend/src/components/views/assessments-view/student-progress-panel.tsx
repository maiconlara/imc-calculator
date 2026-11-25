"use client";

import { Box, Skeleton } from "@chakra-ui/react";
import { Panel } from "@/components/ui/panel";
import { ProgressChart } from "@/components/ui/progress-chart";
import { LoadErrorMessage } from "@/components/ui/state-message";
import { useGetAssessmentSummary, useGetUserOptions } from "@/hooks";
import { ASSESSED_STUDENT_OPTIONS_FILTERS } from "@/lib/initial-filters";

/**
 * BMI progress of the student chosen in the filter, from the first assessment to the
 * latest one.
 *
 * @param props - Id of the chosen student.
 */
export function StudentProgressPanel({ studentId }: { studentId: string }) {
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
