import { Box, Skeleton } from "@chakra-ui/react";

/**
 * Placeholder of one filter of the list filter bar: its label and its field.
 *
 * @param width - Width token of the field from medium screens up.
 */
export function FilterFieldSkeleton({ width }: { width: string }) {
  return (
    <Box w={{ base: "full", md: width }} hideBelow="md">
      <Skeleton h="3" w="16" mb="2" />
      <Skeleton h="8" borderRadius="l2" />
    </Box>
  );
}
