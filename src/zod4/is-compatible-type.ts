import type { $ZodUnion } from "zod/v4/core";
import { createCompareFn } from "./create-compare-fn.ts";
import { isSameType } from "./is-same-type.ts";
import type { CompareRule } from "./types.ts";
import { flatUnwrapUnion, isZodType } from "./utils.ts";

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
      if (
        !("_zod" in higherType) ||
        !("def" in higherType._zod) ||
        !("_zod" in lowerType) ||
        !("def" in lowerType._zod)
      ) {
        throw new Error(
          "Failed to compare type! " + higherType + " " + lowerType,
        );
      }
      return next();
    },
  },
  {
    name: "check optional/nullable on lower",
    compare: (higherType, lowerType, next, recheck) => {
      const lowerDef = lowerType._zod.def;
      if (
        (lowerDef.type === "optional" || lowerDef.type === "nullable") &&
        "innerType" in lowerDef &&
        typeof lowerDef.innerType === "object" &&
        isZodType(lowerDef.innerType)
      ) {
        return recheck(higherType, lowerDef.innerType);
      }
      return next();
    },
  },
  {
    name: "check union",
    compare: (higherType, lowerType, next, recheck) => {
      const aType = higherType._zod.def.type;
      const bType = lowerType._zod.def.type;
      if (aType === "union" && bType === "union") {
        const aOpts = flatUnwrapUnion(higherType as $ZodUnion);
        const bOpts = flatUnwrapUnion(lowerType as $ZodUnion);
        // Every option in higher must be accepted by at least one option in lower
        return aOpts.every((optA) => bOpts.some((optB) => recheck(optA, optB)));
      }
      if (aType === "union") {
        const aOpts = flatUnwrapUnion(higherType as $ZodUnion);
        // All options from higher must be compatible with the (non-union) lower
        return aOpts.every((opt) => recheck(opt, lowerType));
      }
      if (bType === "union") {
        const bOpts = flatUnwrapUnion(lowerType as $ZodUnion);
        // Higher must match at least one option in lower
        return bOpts.some((opt) => recheck(higherType, opt));
      }
      return next();
    },
  },
  {
    name: "compare type by kind",
    compare: (higherType, lowerType, next) => {
      const aTypeName = higherType._zod.def.type;
      const bTypeName = lowerType._zod.def.type;
      if (aTypeName !== bTypeName) return false;
      return next();
    },
  },
  {
    name: "check object (structural subset)",
    compare: (higherType, lowerType, next, recheck) => {
      const aType = higherType._zod.def.type;
      const bType = lowerType._zod.def.type;
      if (aType === "object" && bType === "object") {
        const superShape = higherType._zod.def.shape;
        const subShape = lowerType._zod.def.shape;
        if (Object.keys(superShape).length < Object.keys(subShape).length)
          return false;
        for (const key in subShape) {
          if (!(key in superShape)) return false;
          if (!recheck(superShape[key], subShape[key])) return false;
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "check array",
    compare: (higherType, lowerType, next, recheck) => {
      const aType = higherType._zod.def.type;
      const bType = lowerType._zod.def.type;
      if (aType === "array" && bType === "array") {
        return recheck(higherType._zod.def.element, lowerType._zod.def.element);
      }
      return next();
    },
  },
  {
    name: "check tuple (length and rest)",
    compare: (higherType, lowerType, next, recheck) => {
      const aType = higherType._zod.def.type;
      const bType = lowerType._zod.def.type;
      if (aType === "tuple" && bType === "tuple") {
        const aItems = higherType._zod.def.items;
        const bItems = lowerType._zod.def.items;
        if (aItems.length < bItems.length) return false;
        for (let i = 0; i < bItems.length; i++) {
          if (!recheck(aItems[i], bItems[i])) return false;
        }
        // If lower has rest, higher must have rest and be compatible
        const aRest = higherType._zod.def.rest;
        const bRest = lowerType._zod.def.rest;
        if (bRest) {
          if (!aRest) return false;
          return recheck(aRest, bRest);
        }
        return true;
      }
      return next();
    },
  },
];

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
