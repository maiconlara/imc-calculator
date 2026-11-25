"use client";

import type { ComponentType } from "react";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import {
  CalendarCheck,
  Minus,
  Ruler,
  Scale,
  TrendingDown,
  TrendingUp,
  type LucideProps,
} from "lucide-react";
import type { ProgressPoint } from "@imc-calculator/shared";
import { ClassificationBadge } from "@/components/ui/badges";
import { BmiScale } from "@/components/ui/bmi-scale";
import { ProgressStatsGrid } from "@/components/ui/dashboard-grids";
import { Panel } from "@/components/ui/panel";
import { ProgressChart } from "@/components/ui/progress-chart";
import { MyProgressSkeleton } from "@/components/ui/skeletons";
import { StatCard } from "@/components/ui/stat-card";
import { LoadErrorMessage, StateMessage } from "@/components/ui/state-message";
import { useGetAssessmentSummary, useSessionUser } from "@/hooks";
import {
  formatBmi,
  formatChange,
  formatDate,
  formatHeight,
  formatNumber,
  formatWeight,
  getChangeDirection,
  getFirstName,
  type ChangeDirection,
} from "@/lib/formatters";

const WEIGHT_CHANGE_DECIMALS = 1;
const BMI_CHANGE_DECIMALS = 2;

const CHANGE_ICONS: Record<ChangeDirection, ComponentType<LucideProps>> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

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

function ProgressOverview({
  progressPoints,
  firstProgressPoint,
  latestProgressPoint,
}: {
  progressPoints: ProgressPoint[];
  firstProgressPoint: ProgressPoint;
  latestProgressPoint: ProgressPoint;
}) {
  const weightChange = latestProgressPoint.weight - firstProgressPoint.weight;
  const bmiChange = latestProgressPoint.bmi - firstProgressPoint.bmi;

  return (
    <Stack gap="6">
      <CurrentBmiHeader
        latestProgressPoint={latestProgressPoint}
        assessmentCount={progressPoints.length}
      />

      <ProgressStatsGrid
        bmiScale={
          <Panel title="Onde você está">
            <BmiScale bmi={latestProgressPoint.bmi} />
          </Panel>
        }
      >
        <StatCard
          label="Variação de peso"
          icon={CHANGE_ICONS[getChangeDirection(weightChange, WEIGHT_CHANGE_DECIMALS)]}
          value={formatChange(weightChange, WEIGHT_CHANGE_DECIMALS, " kg")}
          hint={`Desde a primeira avaliação, em ${formatDate(firstProgressPoint.createdAt)}`}
        />
        <StatCard
          label="Variação do IMC"
          icon={CHANGE_ICONS[getChangeDirection(bmiChange, BMI_CHANGE_DECIMALS)]}
          value={formatChange(bmiChange, BMI_CHANGE_DECIMALS)}
          hint={`De ${formatBmi(firstProgressPoint.bmi)} para ${formatBmi(latestProgressPoint.bmi)}`}
        />
      </ProgressStatsGrid>

      <Panel
        title="Sua evolução"
        description="Cada ponto é uma avaliação registrada pelo professor."
      >
        <ProgressChart progressPoints={progressPoints} />
      </Panel>
    </Stack>
  );
}

function CurrentBmiHeader({
  latestProgressPoint,
  assessmentCount,
}: {
  latestProgressPoint: ProgressPoint;
  assessmentCount: number;
}) {
  const sessionUser = useSessionUser();

  return (
    <Box
      bg="graphite.900"
      color="white"
      borderRadius="l3"
      px={{ base: "6", md: "8" }}
      py={{ base: "6", md: "8" }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        right="-16"
        bottom="-24"
        boxSize="72"
        borderRadius="full"
        borderWidth="40px"
        borderColor="brand.solid"
        opacity="0.1"
        aria-hidden="true"
      />
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        gap="6"
        position="relative"
      >
        <Box minW="0">
          <Text textStyle="monoLabel" color="whiteAlpha.600">
            {getFirstName(sessionUser.name)}, seu IMC atual
          </Text>
          <Text
            fontFamily="heading"
            fontWeight="900"
            fontSize={{ base: "6xl", md: "7xl" }}
            lineHeight="1"
            color="brand.solid"
            mt="2"
          >
            {formatBmi(latestProgressPoint.bmi)}
          </Text>
          <Flex mt="3" gap="3" align="center" wrap="wrap">
            <ClassificationBadge
              classification={latestProgressPoint.classification}
              size="lg"
            />
            <Text fontSize="sm" color="whiteAlpha.700">
              Avaliado em {formatDate(latestProgressPoint.createdAt)}
            </Text>
          </Flex>
        </Box>
        <Flex
          wrap="wrap"
          columnGap={{ base: "6", md: "10" }}
          rowGap="4"
          alignSelf={{ md: "end" }}
        >
          <HeaderMetric
            icon={Scale}
            label="Peso"
            value={formatWeight(latestProgressPoint.weight)}
          />
          <HeaderMetric
            icon={Ruler}
            label="Altura"
            value={formatHeight(latestProgressPoint.height)}
          />
          <HeaderMetric
            icon={CalendarCheck}
            label="Avaliações"
            value={formatNumber(assessmentCount, 0)}
          />
        </Flex>
      </Flex>
    </Box>
  );
}

function HeaderMetric({
  icon: MetricIcon,
  label,
  value,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Flex align="center" gap="1.5" color="whiteAlpha.600">
        <MetricIcon size={14} aria-hidden="true" />
        <Text textStyle="monoLabel">{label}</Text>
      </Flex>
      <Text
        mt="1"
        fontFamily="heading"
        fontWeight="800"
        fontSize={{ base: "lg", md: "2xl" }}
        whiteSpace="nowrap"
      >
        {value}
      </Text>
    </Box>
  );
}
