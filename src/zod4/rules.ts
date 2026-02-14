import type { CompareFn, CompareRule } from "./types.ts";

export const defineCompareRule = (
  name: string,
  compare: CompareFn,
): CompareRule => ({
  name,
  compare,
});
