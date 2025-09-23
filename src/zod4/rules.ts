import type { CompareFn } from "./types.ts";

export const defineCompareRule = (name: string, rule: CompareFn) => ({
  name,
  rule,
});
