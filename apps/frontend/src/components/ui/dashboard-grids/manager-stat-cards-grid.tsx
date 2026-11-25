import type { ReactNode } from "react";
import { Grid } from "@chakra-ui/react";

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
