"use client";

import { Box, Skeleton, Stack, Table } from "@chakra-ui/react";
import type { DataTableRowsProps } from "./data-table.types";

const ROW_HEIGHT = "60px";
const SKELETON_CARD_COUNT = 4;

export function DataTableRows<Row>({
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
