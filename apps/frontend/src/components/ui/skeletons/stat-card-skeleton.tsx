import { Card, Flex, Skeleton } from "@chakra-ui/react";

/**
 * Placeholder of a `StatCard` while its number loads.
 */
export function StatCardSkeleton() {
  return (
    <Card.Root variant="outline" borderRadius="l3" bg="bg.panel" h="full">
      <Card.Body p="5" gap="3">
        <Flex justify="space-between" align="start" gap="3">
          <Skeleton h="3" w="24" />
          <Skeleton boxSize="9" borderRadius="l2" />
        </Flex>
        <Skeleton h="9" w="20" />
        <Skeleton h="3" w="40" maxW="full" />
      </Card.Body>
    </Card.Root>
  );
}
