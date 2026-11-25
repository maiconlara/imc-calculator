"use client";

import { Box, Stack } from "@chakra-ui/react";
import { getAssessmentsEmptyState } from "@/components/assessments";
import { PanelRowsSkeleton } from "@/components/ui/skeletons";
import { LoadErrorMessage, StateMessage } from "@/components/ui/state-message";
import { useGetAssessments, useSessionUser } from "@/hooks";
import { LATEST_ASSESSMENTS_FILTERS } from "@/lib/initial-filters";
import { LatestAssessmentRow } from "./latest-assessment-row";

export function LatestAssessmentsList() {
  const sessionUser = useSessionUser();
  const latestAssessmentsQuery = useGetAssessments(LATEST_ASSESSMENTS_FILTERS);

  if (latestAssessmentsQuery.error) {
    return (
      <LoadErrorMessage
        title="Não foi possível carregar as últimas avaliações"
        loadError={latestAssessmentsQuery.error}
        onRetry={() => void latestAssessmentsQuery.refetch()}
      />
    );
  }

  if (!latestAssessmentsQuery.data) {
    return (
      <PanelRowsSkeleton
        rows={LATEST_ASSESSMENTS_FILTERS.pageSize}
        rowHeight="10"
        label="Carregando as últimas avaliações"
      />
    );
  }

  if (latestAssessmentsQuery.data.items.length === 0) {
    return <StateMessage {...getAssessmentsEmptyState(sessionUser.role)} />;
  }

  return (
    <Stack gap="0" separator={<Box borderBottomWidth="1px" />}>
      {latestAssessmentsQuery.data.items.map((assessment) => (
        <LatestAssessmentRow key={assessment.id} assessment={assessment} />
      ))}
    </Stack>
  );
}
