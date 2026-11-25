import { Skeleton, Stack } from "@chakra-ui/react";

/**
 * Placeholder rows of a block inside a `Panel` while its data loads.
 *
 * @param rows - Number of rows.
 * @param rowHeight - Height token of each row.
 * @param label - What is loading, read by screen readers.
 */
export function PanelRowsSkeleton({
  rows,
  rowHeight,
  label,
}: {
  rows: number;
  rowHeight: string;
  label?: string;
}) {
  return (
    <Stack gap="4" aria-busy={label ? "true" : undefined} aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} h={rowHeight} />
      ))}
    </Stack>
  );
}
