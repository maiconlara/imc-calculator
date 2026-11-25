"use client";

import { useRef } from "react";
import { Button, VStack } from "@chakra-ui/react";
import { FileSearch, X } from "lucide-react";
import {
  LoadErrorMessage,
  StateMessage,
  type StateMessageContent,
} from "@/components/ui/state-message";
import { getTotalPages } from "@/lib/pagination";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableRows } from "./data-table-rows";
import type { DataTableRowsProps, ItemNoun, TablePagination } from "./data-table.types";

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
