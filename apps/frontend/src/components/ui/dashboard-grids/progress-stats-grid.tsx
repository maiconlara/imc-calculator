import type { ReactNode } from "react";
import { Box, Grid } from "@chakra-ui/react";

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
