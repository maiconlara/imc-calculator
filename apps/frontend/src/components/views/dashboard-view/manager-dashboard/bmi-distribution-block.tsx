"use client";

import { UserX } from "lucide-react";
import { BMI_RANGES } from "@imc-calculator/shared";
import { BmiDistribution } from "@/components/ui/bmi-distribution";
import { PanelRowsSkeleton } from "@/components/ui/skeletons";
import { LoadErrorMessage, StateMessage } from "@/components/ui/state-message";
import { useGetAssessmentSummary } from "@/hooks";

export function BmiDistributionBlock() {
  const assessmentSummaryQuery = useGetAssessmentSummary(undefined);

  if (assessmentSummaryQuery.error) {
    return (
      <LoadErrorMessage
        title="Não foi possível carregar a classificação"
        loadError={assessmentSummaryQuery.error}
        onRetry={() => void assessmentSummaryQuery.refetch()}
      />
    );
  }

  if (!assessmentSummaryQuery.data) {
    return (
      <PanelRowsSkeleton
        rows={BMI_RANGES.length}
        rowHeight="9"
        label="Carregando a classificação"
      />
    );
  }

  if (assessmentSummaryQuery.data.assessedStudents === 0) {
    return (
      <StateMessage
        icon={UserX}
        title="Nenhum aluno avaliado ainda"
        description="A classificação aparece aqui depois da primeira avaliação."
      />
    );
  }

  return <BmiDistribution distribution={assessmentSummaryQuery.data.distribution} />;
}
