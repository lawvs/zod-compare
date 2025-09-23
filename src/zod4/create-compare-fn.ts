import type { $ZodFunction, $ZodType, $ZodTypes } from "zod/v4/core";

import { type CompareContext, type CompareRule } from "./types.ts";

export const createCompareFn = (rules: CompareRule[]) => {
  const isSameTypeFn = (
    left: Readonly<
      | $ZodType
      // Before zod v4.1, the $ZodFunction was not a Zod schema.
      // Learn more: https://github.com/colinhacks/zod/pull/5121/
      // Remove this union when we bump the zod version to v4.1+
      | $ZodFunction
    >,
    right: Readonly<$ZodType | $ZodFunction>,
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
