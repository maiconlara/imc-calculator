"use client";

import { useState } from "react";

/**
 * Page state of a paginated list with filters.
 *
 * @param initialPage - Page shown first, the same one the server prefetched.
 * @returns The current page and helpers that keep it consistent with filters and removals.
 */
export function useListPagination(initialPage: number) {
  const [page, setPage] = useState(initialPage);

  /**
   * Applies a filter change and goes back to the first page, where the new results start.
   *
   * @param changeFilters - Function that updates the filter state.
   */
  function applyFilters(changeFilters: () => void) {
    changeFilters();
    setPage(1);
  }

  /**
   * Captures, before a row is removed, whether it is the last one of a page past the
   * first, so the list can step back instead of showing an empty page.
   *
   * @param rowsOnCurrentPage - Rows shown on the current page before the removal.
   * @returns Function to call once the removal succeeded.
   */
  function prepareRowRemoval(rowsOnCurrentPage: number) {
    const removesLastRowOfPage = rowsOnCurrentPage === 1 && page > 1;
    return () => {
      if (removesLastRowOfPage) setPage(page - 1);
    };
  }

  return { page, setPage, applyFilters, prepareRowRemoval };
}
