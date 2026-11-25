"use client";

import { Button, Flex, HStack, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pluralize } from "@/lib/formatters";
import { getTotalPages } from "@/lib/pagination";
import type { ItemNoun, TablePagination } from "./data-table.types";

export function DataTablePagination({
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
