import { createCompareFn } from "./create-compare-fn.ts";
import { isSameType } from "./is-same-type.ts";
import type { CompareRule } from "./types.ts";

export const isCompatibleTypePresetRules: CompareRule[] = [
  {
    name: "is same type",
    compare: (higherType, lowerType, next) => {
      if (isSameType(higherType, lowerType)) {
        return true;
      }
      return next();
    },
  },
  {
    name: "check typeName",
    compare: (higherType, lowerType, next) => {
      // In Zod4, type information is in _zod.def
      if (!("_zod" in higherType) || !("def" in higherType._zod) || !("_zod" in lowerType) || !("def" in lowerType._zod)) {
        throw new Error("Failed to compare type! " + higherType + " " + lowerType);
      }
      return next();
    },
  },
  // Additional rules will be added here based on Zod4's structure
  // The rules will need to be adapted to use _zod.def instead of _def
];

export const isCompatibleType = createCompareFn(isCompatibleTypePresetRules);
