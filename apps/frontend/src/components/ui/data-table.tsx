"use client";

import { useRef, type ReactNode } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Skeleton,
  Stack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, FileSearch, X } from "lucide-react";
import { pluralize } from "@/lib/formatters";
import {
  LoadErrorMessage,
  StateMessage,
  type StateMessageContent,
} from "./state-message";

export interface TableColumn<Row> {
  id: string;
  header: string;
  renderCell: (row: Row) => ReactNode;
  align?: "start" | "end" | "center";
  width?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface ItemNoun {
  singular: string;
  plural: string;
}

interface DataTableRowsProps<Row> {
  rows: readonly Row[];
  columns: readonly TableColumn<Row>[];
  getRowKey: (row: Row) => string;
  renderCard?: (row: Row) => ReactNode;
  isLoading: boolean;
  isRefreshing: boolean;
  skeletonRowCount: number;
}

interface DataTableProps<Row> extends Omit<DataTableRowsProps<Row>, "skeletonRowCount"> {
  loadError: Error | null;
  onRetry: () => void;
  emptyState: StateMessageContent;
  filteredEmptyState: Omit<StateMessageContent, "action">;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  pagination: TablePagination;
  itemNoun: ItemNoun;
}

const ROW_HEIGHT = "60px";
const SKELETON_CARD_COUNT = 4;

function getTotalPages(pagination: TablePagination): number {
  return Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
}

/**
 * Paginated list with a table on wide screens and, when `renderCard` is given, one
 * card per row on phones, so the key columns and actions never hide behind a sideways
 * scroll. It shows the four states of a list: loading, failed load with a retry,
 * nothing registered yet and nothing matching the filters. An empty list that is being
 * refreshed shows the skeleton, since its empty state belonged to the previous filters.
 */
export function DataTable<Row>({
  loadError,
  onRetry,
  emptyState,
  filteredEmptyState,
  hasActiveFilters,
  onClearFilters,
  pagination,
  itemNoun,
  ...rowsProps
}: DataTableProps<Row>) {
  const tableTopRef = useRef<HTMLDivElement>(null);
  const lastPage = getTotalPages(pagination);
  const hasNoRows = rowsProps.rows.length === 0;
  const isWaitingForRows = rowsProps.isLoading || (rowsProps.isRefreshing && hasNoRows);
  const isEmpty = !isWaitingForRows && hasNoRows;
  const isPastLastPage = isEmpty && pagination.total > 0 && pagination.page > lastPage;

  function goToPage(page: number) {
    pagination.onPageChange(page);
    const tableTop = tableTopRef.current;
    if (tableTop && tableTop.getBoundingClientRect().top < 0) {
      tableTop.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  return (
    <VStack
      ref={tableTopRef}
      align="stretch"
      gap="4"
      scrollMarginTop={{ base: "20", lg: "6" }}
      aria-busy={rowsProps.isLoading || rowsProps.isRefreshing}
    >
      {loadError ? (
        <LoadErrorMessage
          title="Não foi possível carregar a lista"
          loadError={loadError}
          onRetry={onRetry}
          isFramed
        />
      ) : isPastLastPage ? (
        <StateMessage
          icon={FileSearch}
          title="Esta página ficou vazia"
          description="A lista mudou desde que a página foi aberta."
          isFramed
          action={
            <Button size="sm" variant="outline" onClick={() => goToPage(lastPage)}>
              Ir para a página {lastPage}
            </Button>
          }
        />
      ) : isEmpty && hasActiveFilters ? (
        <StateMessage
          {...filteredEmptyState}
          isFramed
          action={
            <Button size="sm" variant="outline" onClick={onClearFilters}>
              <X /> Limpar filtros
            </Button>
          }
        />
      ) : isEmpty ? (
        <StateMessage {...emptyState} isFramed />
      ) : (
        <DataTableRows
          {...rowsProps}
          isLoading={isWaitingForRows}
          skeletonRowCount={pagination.pageSize}
        />
      )}

      {!loadError && pagination.total > 0 ? (
        <DataTablePagination
          pagination={pagination}
          itemNoun={itemNoun}
          isLoading={isWaitingForRows}
          onPageChange={goToPage}
        />
      ) : null}
    </VStack>
  );
}

function DataTableRows<Row>({
  rows,
  columns,
  getRowKey,
  renderCard,
  isLoading,
  isRefreshing,
  skeletonRowCount,
}: DataTableRowsProps<Row>) {
  return (
    <>
      {renderCard ? (
        <Stack
          hideFrom="md"
          gap="3"
          opacity={isRefreshing ? 0.6 : 1}
          transition="opacity 0.15s"
        >
          {isLoading
            ? Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
                <Skeleton key={`card-${index}`} h="28" borderRadius="l3" />
              ))
            : rows.map((row) => <Box key={getRowKey(row)}>{renderCard(row)}</Box>)}
        </Stack>
      ) : null}

      <Box
        hideBelow={renderCard ? "md" : undefined}
        bg="bg.panel"
        borderWidth="1px"
        borderRadius="l3"
        overflow="hidden"
      >
        <Table.ScrollArea>
          <Table.Root size="md" css={{ "& td, & th": { px: "4" } }}>
            <Table.Header bg="bg.subtle">
              <Table.Row>
                {columns.map((column) => (
                  <Table.ColumnHeader
                    key={column.id}
                    textAlign={column.align}
                    w={column.width}
                    hideBelow={column.hideBelow}
                    textStyle="monoLabel"
                    color="fg.muted"
                    whiteSpace="nowrap"
                  >
                    {column.header}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body opacity={isRefreshing ? 0.6 : 1} transition="opacity 0.15s">
              {isLoading
                ? Array.from({ length: skeletonRowCount }, (_, index) => (
                    <Table.Row key={`skeleton-${index}`} h={ROW_HEIGHT}>
                      {columns.map((column) => (
                        <Table.Cell key={column.id} hideBelow={column.hideBelow}>
                          <Skeleton h="4" w="24" maxW="full" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                : rows.map((row) => (
                    <Table.Row
                      key={getRowKey(row)}
                      h={ROW_HEIGHT}
                      _hover={{ bg: "bg.subtle" }}
                    >
                      {columns.map((column) => (
                        <Table.Cell
                          key={column.id}
                          textAlign={column.align}
                          hideBelow={column.hideBelow}
                          fontSize="sm"
                        >
                          {column.renderCell(row)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>
    </>
  );
}

function DataTablePagination({
  pagination,
  itemNoun,
  isLoading,
  onPageChange,
}: {
  pagination: TablePagination;
  itemNoun: ItemNoun;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  const lastPage = getTotalPages(pagination);
  const currentPage = Math.min(pagination.page, lastPage);

  return (
    <Flex
      justify="space-between"
      align="center"
      gap="3"
      wrap="wrap"
      fontSize="sm"
      color="fg.muted"
    >
      <Text>
        Página{" "}
        <Text as="span" fontWeight="700" color="fg">
          {currentPage}
        </Text>{" "}
        de{" "}
        <Text as="span" fontWeight="700" color="fg">
          {lastPage}
        </Text>{" "}
        · {pluralize(pagination.total, itemNoun.singular, itemNoun.plural)}
      </Text>
      <HStack gap="2">
        <Button
          size="sm"
          variant="outline"
          bg="bg.panel"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft /> Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          bg="bg.panel"
          disabled={currentPage >= lastPage || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Próxima <ChevronRight />
        </Button>
      </HStack>
    </Flex>
  );
}
