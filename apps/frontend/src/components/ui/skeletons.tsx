import { Box, Card, Flex, Skeleton, Stack } from "@chakra-ui/react";
import { BMI_RANGES } from "@imc-calculator/shared";
import { LATEST_ASSESSMENTS_FILTERS } from "@/lib/initial-filters";
import {
  MANAGER_STAT_CARD_COUNT,
  ManagerPanelsGrid,
  ManagerStatCardsGrid,
  ProgressStatsGrid,
} from "./dashboard-grids";

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

function PanelSkeleton({ rows, rowHeight }: { rows: number; rowHeight: string }) {
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

/**
 * Placeholder of the dashboard of administrators and teachers: the four numbers, the
 * BMI distribution and the latest assessments.
 */
export function ManagerDashboardSkeleton() {
  return (
    <Stack gap="6" aria-busy="true" aria-label="Carregando o dashboard">
      <ManagerStatCardsGrid>
        {Array.from({ length: MANAGER_STAT_CARD_COUNT }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </ManagerStatCardsGrid>
      <ManagerPanelsGrid>
        <PanelSkeleton rows={BMI_RANGES.length} rowHeight="9" />
        <PanelSkeleton rows={LATEST_ASSESSMENTS_FILTERS.pageSize} rowHeight="10" />
      </ManagerPanelsGrid>
    </Stack>
  );
}

/**
 * Placeholder of the student's own progress: the current BMI header, the changes, the
 * BMI scale and the chart.
 */
export function MyProgressSkeleton() {
  return (
    <Stack gap="6" aria-busy="true" aria-label="Carregando sua evolução">
      <Skeleton h={{ base: "64", md: "44" }} borderRadius="l3" />
      <ProgressStatsGrid bmiScale={<PanelSkeleton rows={1} rowHeight="10" />}>
        <StatCardSkeleton />
        <StatCardSkeleton />
      </ProgressStatsGrid>
      <PanelSkeleton rows={1} rowHeight="64" />
    </Stack>
  );
}

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
