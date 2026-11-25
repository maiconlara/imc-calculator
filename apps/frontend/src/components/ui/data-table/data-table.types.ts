import type { ReactNode } from "react";

export interface TableColumn<Row> {
  id: string;
  header: string;
  renderCell: (row: Row) => ReactNode;
  align?: "start" | "end" | "center";
  width?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface ItemNoun {
  singular: string;
  plural: string;
}

export interface DataTableRowsProps<Row> {
  rows: readonly Row[];
  columns: readonly TableColumn<Row>[];
  getRowKey: (row: Row) => string;
  renderCard?: (row: Row) => ReactNode;
  isLoading: boolean;
  isRefreshing: boolean;
  skeletonRowCount: number;
}
