/**
 * Number of pages of a paginated list, never less than one, so an empty list still
 * reads as page 1 of 1.
 *
 * @param pagination - Total number of rows and rows per page.
 * @returns The number of the last page.
 */
export function getTotalPages({
  total,
  pageSize,
}: {
  total: number;
  pageSize: number;
}): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
