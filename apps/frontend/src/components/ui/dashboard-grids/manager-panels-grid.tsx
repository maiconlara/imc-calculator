import type { ReactNode } from "react";
import { Grid } from "@chakra-ui/react";

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
