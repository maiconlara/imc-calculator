"use client";

import { useEffect, useState } from "react";

/**
 * Delays a fast changing value, such as a search box, until the user stops typing.
 *
 * @param value - Current value.
 * @param delayMs - Quiet time before the value is accepted.
 * @returns The last value that stayed unchanged for `delayMs`.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const debounceTimer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(debounceTimer);
  }, [value, delayMs]);

  return debouncedValue;
}
