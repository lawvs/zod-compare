import type * as z3 from "zod/v3";
import type * as z4 from "zod/v4/core";
import { haveSameZodMajor, isZod3Schema, isZod4Schema } from "./utils.ts";
import {
  isCompatibleType as isCompatibleZod3Type,
  isSameType as isSameZod3Type,
} from "./zod3/index.ts";
import type { LegacyZodFunction } from "./zod4/compat.ts";
import {
  isCompatibleType as isCompatibleZod4Type,
  isSameType as isSameZod4Type,
} from "./zod4/index.ts";

// Export versions checking utilities
export { haveSameZodMajor, isZod3Schema, isZod4Schema };

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
export const isSameType = (
  a: z3.ZodTypeAny | z4.$ZodType | LegacyZodFunction,
  b: z3.ZodTypeAny | z4.$ZodType | LegacyZodFunction,
): boolean => {
  if (isZod4Schema(a) && isZod4Schema(b)) {
    return isSameZod4Type(a, b);
  }
  if (isZod3Schema(a) && isZod3Schema(b)) {
    return isSameZod3Type(a, b);
  }
  throw new Error("Failed to compare types: different Zod versions");
};

/**
 * Check if a the higherType matches the lowerType
 *
 * @deprecated This a unstable API and still in development
 *
 * @param higherType The looser type
 * @param lowerType The stricter type
 *
 * @example
 * ```ts
 * isCompatibleType(z.string(), z.string()); // true
 *
 * isCompatibleType(
 *   z.object({ name: z.string(), other: z.number() }),
 *   z.object({ name: z.string() })
 * );
 * // true
 * ```
 */
export const isCompatibleType = (
  a: z3.ZodTypeAny | z4.$ZodType | LegacyZodFunction,
  b: z3.ZodTypeAny | z4.$ZodType | LegacyZodFunction,
): boolean => {
  if (isZod4Schema(a) && isZod4Schema(b)) {
    return isCompatibleZod4Type(a, b);
  }
  if (isZod3Schema(a) && isZod3Schema(b)) {
    return isCompatibleZod3Type(a, b);
  }
  return false;
};
