import type { ReactNode } from "react";
import { Box, Grid } from "@chakra-ui/react";

export const MANAGER_STAT_CARD_COUNT = 4;

/**
 * Grid of the number cards of the manager dashboard: one column on phones, two on
 * small screens and four on wide ones. The view and its skeleton share it, so the
 * page does not jump when the data replaces the placeholder.
 *
 * @param isLoading - Marks the grid as busy while it holds skeleton cards.
 */
export function ManagerStatCardsGrid({
  isLoading = false,
  children,
}: {
  isLoading?: boolean;
  children: ReactNode;
}) {
  return (
    <Grid
      templateColumns={{
        base: "minmax(0, 1fr)",
        sm: "repeat(2, minmax(0, 1fr))",
        xl: `repeat(${MANAGER_STAT_CARD_COUNT}, minmax(0, 1fr))`,
      }}
      gap="4"
      aria-busy={isLoading ? "true" : undefined}
      aria-label={isLoading ? "Carregando os números" : undefined}
    >
      {children}
    </Grid>
  );
}

/**
 * Grid of the two panels of the manager dashboard: the BMI distribution, wider, and
 * the latest assessments.
 */
export function ManagerPanelsGrid({ children }: { children: ReactNode }) {
  return (
    <Grid
      templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 7fr) minmax(0, 5fr)" }}
      gap="4"
      alignItems="stretch"
    >
      {children}
    </Grid>
  );
}

/**
 * Grid of the student's progress: the two change cards and the BMI scale, which takes
 * a full row on medium screens and its own column on wide ones.
 *
 * @param bmiScale - The panel with the student's place on the BMI scale.
 */
export function ProgressStatsGrid({
  children,
  bmiScale,
}: {
  children: ReactNode;
  bmiScale: ReactNode;
}) {
  return (
    <Grid
      templateColumns={{
        base: "minmax(0, 1fr)",
        md: "repeat(2, minmax(0, 1fr))",
        xl: "repeat(3, minmax(0, 1fr))",
      }}
      gap="4"
    >
      {children}
      <Box gridColumn={{ md: "span 2", xl: "auto" }}>{bmiScale}</Box>
    </Grid>
  );
}
