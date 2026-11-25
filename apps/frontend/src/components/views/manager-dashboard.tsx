"use client";

import NextLink from "next/link";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { Activity, ArrowRight, CalendarCheck, Gauge, UserX, Users } from "lucide-react";
import { BMI_RANGES, classifyBmi, type PublicAssessment } from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import { BmiDistribution } from "@/components/ui/bmi-distribution";
import {
  MANAGER_STAT_CARD_COUNT,
  ManagerPanelsGrid,
  ManagerStatCardsGrid,
} from "@/components/ui/dashboard-grids";
import { Panel } from "@/components/ui/panel";
import { PanelRowsSkeleton, StatCardSkeleton } from "@/components/ui/skeletons";
import { StatCard } from "@/components/ui/stat-card";
import { LoadErrorMessage, StateMessage } from "@/components/ui/state-message";
import { useGetAssessmentSummary, useGetAssessments, useSessionUser } from "@/hooks";
import { formatBmi, formatDate, formatNumber, pluralize } from "@/lib/formatters";
import { LATEST_ASSESSMENTS_FILTERS } from "@/lib/initial-filters";
import { PANEL_ROUTES } from "@/lib/routes";
import { getAssessedStudentsLabel } from "@/lib/screen-titles";
import { getAssessmentsEmptyState } from "./assessments-empty-state";

const MISSING_NUMBER = "--";

export function ManagerDashboard() {
  return (
    <Stack gap="6">
      <SummaryStatCards />
      <ManagerPanelsGrid>
        <Panel
          title="Classificação atual"
          description="Última avaliação de cada aluno ativo, pela tabela de IMC da OMS."
        >
          <BmiDistributionBlock />
        </Panel>
        <Panel
          title="Últimas avaliações"
          action={
            <Button asChild size="xs" variant="ghost" flexShrink={0}>
              <NextLink href={PANEL_ROUTES.assessments}>
                Ver todas <ArrowRight />
              </NextLink>
            </Button>
          }
        >
          <LatestAssessmentsList />
        </Panel>
      </ManagerPanelsGrid>
    </Stack>
  );
}

function SummaryStatCards() {
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

function BmiDistributionBlock() {
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

function LatestAssessmentsList() {
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

function LatestAssessmentRow({ assessment }: { assessment: PublicAssessment }) {
  return (
    <Flex py="3" justify="space-between" align="center" gap="3">
      <Box minW="0">
        <Text fontWeight="600" truncate>
          {assessment.student.name}
        </Text>
        <Text fontSize="xs" color="fg.muted" truncate>
          {formatDate(assessment.createdAt)} · por {assessment.assessor.name}
        </Text>
      </Box>
      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "end", sm: "center" }}
        gap={{ base: "1", sm: "3" }}
        flexShrink={0}
      >
        <Text fontFamily="heading" fontWeight="800">
          {formatBmi(assessment.bmi)}
        </Text>
        <ClassificationBadge classification={assessment.classification} size="sm" />
      </Flex>
    </Flex>
  );
}
