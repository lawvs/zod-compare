import type { ZodType } from "zod";
import { type CompareContext, type CompareRule } from "./types.ts";

export const createCompareFn = (rules: CompareRule[]) => {
  const isSameTypeFn = (
    a: ZodType,
    b: ZodType,
    context: CompareContext = {},
  ): boolean => {
    let prevIndex = -1;
    const runner = (index: number): boolean => {
      if (index === rules.length) {
        throw new Error("Failed to compare type! " + a + " " + b);
      }
      if (index === prevIndex) {
        throw new Error("next() called multiple times");
      }
      prevIndex = index;
      const rule = rules[index];

      const compareResult = rule.compare(
        a,
        b,
        () => runner(index + 1),
        (a, b) => isSameTypeFn(a, b, context),
        context,
      );

      if ("stacks" in context && Array.isArray(context.stacks)) {
        context.stacks.push({
          name: rule.name,
          target: [a, b],
          result: compareResult,
        });
      }

      return compareResult;
    };

    return runner(0);
  };
  return isSameTypeFn;
};

/**
 * @deprecated Use {@link createCompareFn} instead.
 */
export const createIsSameTypeFn = createCompareFn;
