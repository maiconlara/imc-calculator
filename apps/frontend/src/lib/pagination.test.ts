import { describe, expect, it } from "vitest";
import { getTotalPages } from "./pagination";

describe("getTotalPages", () => {
  it.each([
    [1, 10, 1],
    [10, 10, 1],
    [11, 10, 2],
    [25, 8, 4],
  ])("splits %s rows in pages of %s into %s pages", (total, pageSize, totalPages) => {
    expect(getTotalPages({ total, pageSize })).toBe(totalPages);
  });

  it("counts an empty list as one page", () => {
    expect(getTotalPages({ total: 0, pageSize: 10 })).toBe(1);
  });
});
