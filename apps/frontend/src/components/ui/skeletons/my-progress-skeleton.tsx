import { Skeleton, Stack } from "@chakra-ui/react";
import { ProgressStatsGrid } from "@/components/ui/dashboard-grids";
import { PanelSkeleton } from "./panel-skeleton";
import { StatCardSkeleton } from "./stat-card-skeleton";

/**
 * Placeholder of the student's own progress: the current BMI header, the changes, the
 * BMI scale and the chart.
 */
export function MyProgressSkeleton() {
  return (
    <Stack gap="6" aria-busy="true" aria-label="Carregando sua evolução">
      <Skeleton h={{ base: "64", md: "44" }} borderRadius="l3" />
      <ProgressStatsGrid bmiScale={<PanelSkeleton rows={1} rowHeight="10" />}>
        <StatCardSkeleton />
        <StatCardSkeleton />
      </ProgressStatsGrid>
      <PanelSkeleton rows={1} rowHeight="64" />
    </Stack>
  );
}
