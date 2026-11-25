import { Card, Skeleton } from "@chakra-ui/react";
import { PanelRowsSkeleton } from "./panel-rows-skeleton";

/**
 * Placeholder of a whole `Panel`: its title, its description and its rows.
 *
 * @param rows - Number of rows.
 * @param rowHeight - Height token of each row.
 */
export function PanelSkeleton({ rows, rowHeight }: { rows: number; rowHeight: string }) {
  return (
    <Card.Root variant="outline" borderRadius="l3" bg="bg.panel" h="full">
      <Card.Header pb="0">
        <Skeleton h="4" w="40" />
        <Skeleton h="3" w="64" maxW="full" mt="2" />
      </Card.Header>
      <Card.Body>
        <PanelRowsSkeleton rows={rows} rowHeight={rowHeight} />
      </Card.Body>
    </Card.Root>
  );
}
