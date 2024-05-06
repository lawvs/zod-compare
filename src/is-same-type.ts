import type { ZodType } from "zod";
import { isSameTypePresetRules } from "./rules.ts";
import { type CompareContext, type CompareRule } from "./types.ts";

export const createIsSameTypeFn = (rules: CompareRule[]) => {
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

      if ("stacks" in context && Array.isArray(context.stacks)) {
        context.stacks.push({
          name: rule.name,
          target: [a, b],
        });
      }

      return rule.compare(
        a,
        b,
        () => runner(index + 1),
        (a, b) => isSameTypeFn(a, b, context),
        context,
      );
    };

    return runner(0);
  };
  return isSameTypeFn;
};

/**
 * isSameType is a function that checks if two ZodTypes are the same.
 *
 * Caveats:
 * - The function does not validate specific criteria such as min or max values, length, email, etc.
 * - It excludes comparisons involving methods like .describe(), .catch(), .default(), .refine(), and .transform().
 *
 * @param a - The first ZodType to compare.
 * @param b - The second ZodType to compare.
 * @returns A boolean indicating whether the two types are the same.
 *
 * @throws Will throw an error if it encounters an unknown type.
 *
 * @example
 * ```ts
 * isSameType(z.string(), z.string()); // true
 * isSameType(z.string(), z.number()); // false
 * ```
 */
export const isSameType = createIsSameTypeFn(isSameTypePresetRules);
