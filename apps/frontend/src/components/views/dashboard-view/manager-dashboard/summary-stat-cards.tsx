"use client";

import { Activity, CalendarCheck, Gauge, Users } from "lucide-react";
import { classifyBmi } from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import {
  MANAGER_STAT_CARD_COUNT,
  ManagerStatCardsGrid,
} from "@/components/ui/dashboard-grids";
import { StatCardSkeleton } from "@/components/ui/skeletons";
import { StatCard } from "@/components/ui/stat-card";
import { LoadErrorMessage } from "@/components/ui/state-message";
import { useGetAssessmentSummary, useSessionUser } from "@/hooks";
import { formatBmi, formatNumber, pluralize } from "@/lib/formatters";
import { getAssessedStudentsLabel } from "@/lib/screen-titles";

const MISSING_NUMBER = "--";

export function SummaryStatCards() {
  const sessionUser = useSessionUser();
  const assessmentSummaryQuery = useGetAssessmentSummary(undefined);
  const assessmentSummary = assessmentSummaryQuery.data;

  if (assessmentSummaryQuery.error) {
    return (
      <LoadErrorMessage
        isFramed
        title="Não foi possível carregar os números"
        loadError={assessmentSummaryQuery.error}
        onRetry={() => void assessmentSummaryQuery.refetch()}
      />
    );
  }

  if (!assessmentSummary) {
    return (
      <ManagerStatCardsGrid isLoading>
        {Array.from({ length: MANAGER_STAT_CARD_COUNT }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </ManagerStatCardsGrid>
    );
  }

  const { activeStudents, averageBmi } = assessmentSummary;

  return (
    <ManagerStatCardsGrid>
      <StatCard
        label="Alunos ativos"
        icon={Users}
        value={activeStudents === null ? MISSING_NUMBER : formatNumber(activeStudents, 0)}
        hint="Cadastros que podem receber avaliação"
      />
      <StatCard
        label="Avaliações no mês"
        icon={CalendarCheck}
        value={formatNumber(assessmentSummary.assessmentsThisMonth, 0)}
        hint={`${pluralize(assessmentSummary.totalAssessments, "avaliação", "avaliações")} no total`}
      />
      <StatCard
        label={getAssessedStudentsLabel(sessionUser.role)}
        icon={Activity}
        value={formatNumber(assessmentSummary.assessedStudents, 0)}
        hint="Ativos com pelo menos uma avaliação"
      />
      <StatCard
        label="IMC médio atual"
        icon={Gauge}
        value={averageBmi === null ? MISSING_NUMBER : formatBmi(averageBmi)}
        hint={
          averageBmi !== null ? (
            <ClassificationBadge classification={classifyBmi(averageBmi)} size="sm" />
          ) : (
            "Considera a última avaliação de cada aluno ativo"
          )
        }
      />
    </ManagerStatCardsGrid>
  );
}
