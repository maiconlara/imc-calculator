import type { ComponentType } from "react";
import { Stack } from "@chakra-ui/react";
import { Minus, TrendingDown, TrendingUp, type LucideProps } from "lucide-react";
import type { ProgressPoint } from "@imc-calculator/shared";
import { BmiScale } from "@/components/ui/bmi-scale";
import { ProgressStatsGrid } from "@/components/ui/dashboard-grids";
import { Panel } from "@/components/ui/panel";
import { ProgressChart } from "@/components/ui/progress-chart";
import { StatCard } from "@/components/ui/stat-card";
import {
  formatBmi,
  formatChange,
  formatDate,
  getChangeDirection,
  type ChangeDirection,
} from "@/lib/formatters";
import { CurrentBmiHeader } from "./current-bmi-header";

const WEIGHT_CHANGE_DECIMALS = 1;
const BMI_CHANGE_DECIMALS = 2;

const CHANGE_ICONS: Record<ChangeDirection, ComponentType<LucideProps>> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export function ProgressOverview({
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
