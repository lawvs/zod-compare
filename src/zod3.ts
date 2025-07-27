export {
  createCompareFn as createZod3CompareFn,
  createIsSameTypeFn as createZod3IsSameTypeFn,
} from "./legacy/create-compare-fn.ts";
export {
  isCompatibleType as isCompatibleZod3Type,
  isCompatibleTypePresetRules as isCompatibleZod3TypePresetRules,
} from "./legacy/is-compatible-type.ts";
export {
  isSameType as isSameZod3Type,
  isSameTypePresetRules as isSameZod3TypePresetRules,
} from "./legacy/is-same-type.ts";
export { defineCompareRule as defineZod3CompareRule } from "./legacy/rules.ts";
export type {
  CompareContext as CompareZod3Context,
  CompareFn as CompareZod3Fn,
  CompareRule as CompareZod3Rule,
} from "./legacy/types.ts";
