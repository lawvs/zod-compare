import type { $ZodType, $ZodTypes } from "zod/v4/core";

import type { LegacyZodFunction } from "./compat.ts";
import { type CompareContext, type CompareRule } from "./types.ts";

export const createCompareFn = (rules: CompareRule[]) => {
  const isSameTypeFn = (
    left: Readonly<$ZodType | LegacyZodFunction>,
    right: Readonly<$ZodType | LegacyZodFunction>,
    context: CompareContext = {},
  ): boolean => {
    let prevIndex = -1;
    const runner = (index: number): boolean => {
      if (index === rules.length) {
        console.error("Failed to compare type! " + left + " " + right);
        return false;
      }
      if (index === prevIndex) {
        console.error("next() called multiple times");
        return false;
      }
      prevIndex = index;
      const rule = rules[index];

      // We check $ZodTypes in the first rule in the isSameType
      const strictA = left as $ZodTypes;
      const strictB = right as $ZodTypes;

      const compareResult = rule.compare(
        strictA,
        strictB,
        () => runner(index + 1),
        (a, b) => isSameTypeFn(a, b, context),
        context,
      );

      if ("stacks" in context && Array.isArray(context.stacks)) {
        context.stacks.push({
          name: rule.name,
          target: [strictA, strictB],
          result: compareResult,
        });
      }

      return compareResult;
    };

    return runner(0);
  };
  return isSameTypeFn;
};
