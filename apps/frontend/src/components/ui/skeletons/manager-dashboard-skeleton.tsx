import { Stack } from "@chakra-ui/react";
import { BMI_RANGES } from "@imc-calculator/shared";
import {
  MANAGER_STAT_CARD_COUNT,
  ManagerPanelsGrid,
  ManagerStatCardsGrid,
} from "@/components/ui/dashboard-grids";
import { LATEST_ASSESSMENTS_FILTERS } from "@/lib/initial-filters";
import { PanelSkeleton } from "./panel-skeleton";
import { StatCardSkeleton } from "./stat-card-skeleton";

/**
 * Placeholder of the dashboard of administrators and teachers: the four numbers, the
 * BMI distribution and the latest assessments.
 */
export function ManagerDashboardSkeleton() {
  return (
    <Stack gap="6" aria-busy="true" aria-label="Carregando o dashboard">
      <ManagerStatCardsGrid>
        {Array.from({ length: MANAGER_STAT_CARD_COUNT }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </ManagerStatCardsGrid>
      <ManagerPanelsGrid>
        <PanelSkeleton rows={BMI_RANGES.length} rowHeight="9" />
        <PanelSkeleton rows={LATEST_ASSESSMENTS_FILTERS.pageSize} rowHeight="10" />
      </ManagerPanelsGrid>
    </Stack>
  );
}
