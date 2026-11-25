"use client";

import { Scale } from "lucide-react";
import { MyProgressSkeleton } from "@/components/ui/skeletons";
import { LoadErrorMessage, StateMessage } from "@/components/ui/state-message";
import { useGetAssessmentSummary } from "@/hooks";
import { ProgressOverview } from "./progress-overview";

export function MyProgress() {
  const assessmentSummaryQuery = useGetAssessmentSummary(undefined);

  if (assessmentSummaryQuery.error) {
    return (
      <LoadErrorMessage
        isFramed
        title="Não foi possível carregar sua evolução"
        loadError={assessmentSummaryQuery.error}
        onRetry={() => void assessmentSummaryQuery.refetch()}
      />
    );
  }

  if (!assessmentSummaryQuery.data) return <MyProgressSkeleton />;

  const progressPoints = assessmentSummaryQuery.data.progress ?? [];
  const firstProgressPoint = progressPoints[0];
  const latestProgressPoint = progressPoints.at(-1);

  if (!firstProgressPoint || !latestProgressPoint) {
    return (
      <StateMessage
        isFramed
        icon={Scale}
        title="Você ainda não tem avaliações"
        description="Peça a um professor para registrar sua primeira avaliação de IMC."
      />
    );
  }

  return (
    <ProgressOverview
      progressPoints={progressPoints}
      firstProgressPoint={firstProgressPoint}
      latestProgressPoint={latestProgressPoint}
    />
  );
}
