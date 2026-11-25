import { Box, Flex, Skeleton, Stack } from "@chakra-ui/react";

function FilterFieldSkeleton({ width }: { width: string }) {
  return (
    <Box w={{ base: "full", md: width }} hideBelow="md">
      <Skeleton h="3" w="16" mb="2" />
      <Skeleton h="8" borderRadius="l2" />
    </Box>
  );
}

/**
 * Placeholder of a list screen while the server fetches its first page: the filter
 * bar, cards on phones and table rows on wider screens.
 *
 * @param filters - Number of filter fields the role sees, besides the search.
 * @param withSearch - Whether the screen has a search field.
 */
export function ListSkeleton({
  filters,
  withSearch = false,
}: {
  filters: number;
  withSearch?: boolean;
}) {
  return (
    <Stack gap="4" aria-busy="true" aria-label="Carregando a lista">
      <Flex wrap="wrap" align="end" gap="3">
        {withSearch ? <FilterFieldSkeleton width="72" /> : null}
        {Array.from({ length: filters }, (_, index) => (
          <FilterFieldSkeleton
            key={index}
            width={index === 0 && !withSearch ? "72" : "52"}
          />
        ))}
        <Skeleton hideFrom="md" h="8" w="28" borderRadius="full" />
      </Flex>

      <Stack hideFrom="md" gap="3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} h="28" borderRadius="l3" />
        ))}
      </Stack>

      <Box
        hideBelow="md"
        bg="bg.panel"
        borderWidth="1px"
        borderRadius="l3"
        overflow="hidden"
      >
        <Flex h="10" px="4" align="center" gap="6" bg="bg.subtle" borderBottomWidth="1px">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} h="2.5" w="16" />
          ))}
        </Flex>
        {Array.from({ length: 8 }, (_, index) => (
          <Flex
            key={index}
            h="60px"
            px="4"
            align="center"
            gap="6"
            borderBottomWidth="1px"
          >
            <Skeleton h="4" w="28" />
            <Skeleton h="4" w="36" />
            <Skeleton h="4" w="24" />
            <Skeleton h="4" w="16" ml="auto" />
            <Skeleton h="6" w="24" borderRadius="full" />
          </Flex>
        ))}
      </Box>
    </Stack>
  );
}
