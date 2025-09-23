import { z, type ZodType } from "zod/v3";
import { createCompareFn } from "./create-compare-fn.ts";
import { isSameType } from "./is-same-type.ts";
import type { CompareRule } from "./types.ts";
import { flatUnwrapUnion } from "./utils.ts";

export const isCompatibleTypePresetRules = [
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
      if (!("typeName" in higherType._def) || !("typeName" in lowerType._def)) {
        throw new Error(
          "Failed to compare type! " + higherType._def + " " + lowerType._def,
        );
      }
      return next();
    },
  },
  {
    name: "check ZodOptional/ZodNullable",
    compare: (higherType, lowerType, next, recheck) => {
      if (
        lowerType instanceof z.ZodOptional ||
        lowerType instanceof z.ZodNullable
      ) {
        return recheck(higherType, lowerType.unwrap());
      }
      return next();
    },
  },
  {
    name: "check ZodUnion",
    compare: (higherType, lowerType, next, recheck) => {
      if (higherType instanceof z.ZodUnion && lowerType instanceof z.ZodUnion) {
        const higherOptions = flatUnwrapUnion(higherType);
        const lowerOptions = flatUnwrapUnion(lowerType);
        for (let i = 0; i < higherOptions.length; i++) {
          const match = lowerOptions.some((option: ZodType) =>
            recheck(higherOptions[i], option),
          );
          if (!match) return false;
        }
        return true;
      }
      if (higherType instanceof z.ZodUnion) {
        const higherOptions = flatUnwrapUnion(higherType);
        return higherOptions.every((option: ZodType) =>
          recheck(option, lowerType),
        );
      }
      if (lowerType instanceof z.ZodUnion) {
        const lowerOptions = flatUnwrapUnion(lowerType);
        return lowerOptions.some((option: ZodType) =>
          recheck(higherType, option),
        );
      }
      return next();
    },
  },
  {
    name: "compare constructor",
    compare: (higherType, lowerType, next) => {
      // We have already checked if the types are ZodUnion or ZodOptional/ZodNullable before
      if (higherType.constructor !== lowerType.constructor) {
        return false;
      }
      return next();
    },
  },
  {
    name: "check ZodObject",
    compare: (higherType, lowerType, next, recheck) => {
      if (
        higherType instanceof z.ZodObject &&
        lowerType instanceof z.ZodObject
      ) {
        const superTypeShape = higherType.shape;
        const subTypeShape = lowerType.shape;
        if (
          Object.keys(superTypeShape).length < Object.keys(subTypeShape).length
        )
          return false;
        for (const key in subTypeShape) {
          if (!(key in superTypeShape)) return false;
          if (!recheck(superTypeShape[key], subTypeShape[key])) {
            return false;
          }
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "check ZodArray",
    compare: (higherType, lowerType, next, recheck) => {
      if (higherType instanceof z.ZodArray && lowerType instanceof z.ZodArray) {
        return recheck(higherType.element, lowerType.element);
      }
      return next();
    },
  },
  {
    name: "check ZodTuple",
    compare: (higherType, lowerType, next, recheck) => {
      if (higherType instanceof z.ZodTuple && lowerType instanceof z.ZodTuple) {
        if (higherType.items.length < lowerType.items.length) return false;
        for (let i = 0; i < lowerType.items.length; i++) {
          if (!recheck(higherType.items[i], lowerType.items[i])) {
            return false;
          }
        }
        // Check rest
        if (lowerType._def.rest) {
          if (!higherType._def.rest) return false;
          return recheck(higherType._def.rest, lowerType._def.rest);
        }
        return true;
      }
      return next();
    },
  },
] as const satisfies CompareRule[];

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
export const isCompatibleType = createCompareFn(isCompatibleTypePresetRules);
