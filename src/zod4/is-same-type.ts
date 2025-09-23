import type { $ZodTypes, $ZodUnion } from "zod/v4/core";
import { createCompareFn } from "./create-compare-fn.ts";
import type { CompareRule } from "./types.ts";
import {
  flatUnwrapUnion,
  isLegacyZodFunction,
  isSimpleType,
  isZodType,
  isZodTypes,
} from "./utils.ts";

export const isSameTypePresetRules = [
  // Compatible pre-v4.1 ZodFunction
  {
    name: "compare legacy ZodFunction",
    compare: (a, b, next, recheck) => {
      if (isLegacyZodFunction(a) || isLegacyZodFunction(b)) {
        if (!isLegacyZodFunction(a) || !isLegacyZodFunction(b)) {
          return false;
        }
        return recheck(
          {
            ...a,
            // @ts-expect-error -- make it look like a ZodType
            _zod: { def: a.def },
          },
          {
            ...b,
            _zod: { def: b.def },
          },
        );
      }
      return next();
    },
  },
  {
    name: "unstable warn",
    compare: (a, b, next) => {
      const unstableTypes = new Set<string>([
        "transform",
        "default",
        "prefault",
        "success",
        "catch",
        "pipe",
        "lazy",
        "custom",
      ] satisfies $ZodTypes["_zod"]["def"]["type"][]);

      if (
        unstableTypes.has(a._zod.def.type) ||
        unstableTypes.has(b._zod.def.type)
      ) {
        const aType = a._zod.def.type;
        const bType = b._zod.def.type;
        console.warn(
          [
            "[zod-compare] Unstable comparison detected.",
            "This library is designed to compare TypeScript-level types (shape/compatibility).",
            "The involved Zod kinds are not standardized/are unstable and results may be approximate:",
            `left.type=\"${aType}\" right.type=\"${bType}\".`,
            "Consider avoiding these kinds or validating with runtime tests if strict equality is required.",
            "Alternatively, compose your own comparator by defining rules and using createCompareFn to override behavior for these kinds.",
            a,
            b,
          ].join(" "),
        );
      }
      return next();
    },
  },
  {
    name: "strict ZodTypes check",
    compare: (a, b, next) => {
      const isZodTypesA = isZodTypes(a);
      const isZodTypesB = isZodTypes(b);
      if (!isZodTypesA || !isZodTypesB) {
        // If neither are Zod types, we can compare them directly
        console.warn("Failed to compare type! " + a + " " + b);
        return false;
      }
      return next();
    },
  },
  {
    name: "undefined check",
    compare: (a, b, next) => {
      if (a === undefined || b === undefined) {
        console.warn("Failed to compare type! " + a + " " + b);
        return false;
      }
      return next();
    },
  },
  {
    name: "compare reference",
    compare: (a, b, next) => {
      if (a === b) {
        return true;
      }
      return next();
    },
  },
  {
    name: "compare type",
    compare: (a, b, next) => {
      const aTypeName = a._zod.def.type;
      const bTypeName = b._zod.def.type;
      if (aTypeName !== bTypeName) {
        return false;
      }
      return next();
    },
  },
  {
    name: "unwrap innerType",
    // ZodOptionalDef
    // ZodNullableDef
    // ZodDefaultDef
    // ZodNonOptionalDef
    // ZodSuccessDef
    // ZodCatchDef
    // ZodReadonlyDef
    // ZodPromiseDef
    compare: (a, b, next, recheck) => {
      const defA = a._zod.def;
      const defB = b._zod.def;
      if ("innerType" in defA && typeof defA.innerType === "object") {
        if (!("innerType" in defB && typeof defB.innerType === "object")) {
          return false;
        }
        if (defA.type !== defB.type) {
          return false;
        }
        const innerA = defA.innerType;
        const innerB = defB.innerType;
        if (!isZodType(innerA) || !isZodType(innerB)) {
          console.warn("Failed to compare inner types", innerA, innerB);
          return false;
        }
        // In ZodDefault/ZodPrefault, the defaultValue will be ignored
        return recheck(innerA, innerB);
      }
      return next();
    },
  },
  {
    name: "compare simple type",
    compare: (a, b, next) => {
      if (isSimpleType(a) || isSimpleType(b)) {
        const aType = a._zod.def.type;
        const bType = b._zod.def.type;
        return aType === bType;
      }
      return next();
    },
  },
  {
    name: "compare array",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "array" && bType === "array") {
        return recheck(a._zod.def.element, b._zod.def.element);
      }
      return next();
    },
  },
  {
    name: "compare object",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "object" && bType === "object") {
        const aShape = a._zod.def.shape;
        const bShape = b._zod.def.shape;
        if (Object.keys(aShape).length !== Object.keys(bShape).length)
          return false;
        for (const key in aShape) {
          if (!(key in bShape)) return false;
          if (!recheck(aShape[key], bShape[key])) return false;
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare record",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "record" && bType === "record") {
        return (
          recheck(a._zod.def.keyType, b._zod.def.keyType) &&
          recheck(a._zod.def.valueType, b._zod.def.valueType)
        );
      }
      return next();
    },
  },
  {
    name: "compare tuple",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "tuple" && bType === "tuple") {
        const aItems = a._zod.def.items;
        const bItems = b._zod.def.items;
        if (aItems.length !== bItems.length) return false;
        for (let i = 0; i < aItems.length; i++) {
          if (!recheck(aItems[i], bItems[i])) return false;
        }
        // Compare rest
        if (a._zod.def.rest || b._zod.def.rest) {
          // If one has rest, the other must have rest
          if (!a._zod.def.rest || !b._zod.def.rest) return false;
          return recheck(a._zod.def.rest, b._zod.def.rest);
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare map",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "map" && bType === "map") {
        return (
          recheck(a._zod.def.keyType, b._zod.def.keyType) &&
          recheck(a._zod.def.valueType, b._zod.def.valueType)
        );
      }
      return next();
    },
  },
  {
    name: "compare set",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "set" && bType === "set") {
        return recheck(a._zod.def.valueType, b._zod.def.valueType);
      }
      return next();
    },
  },
  {
    name: "compare enum",
    compare: (a, b, next) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "enum" && bType === "enum") {
        const aEntries = a._zod.def.entries as Record<string, unknown>;
        const bEntries = b._zod.def.entries as Record<string, unknown>;
        const aKeys = Object.keys(aEntries);
        const bKeys = Object.keys(bEntries);
        if (aKeys.length !== bKeys.length) return false;
        for (const key of aKeys) {
          if (!(key in bEntries)) return false;
          if (aEntries[key] !== bEntries[key]) return false;
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare literal",
    compare: (a, b, next) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "literal" && bType === "literal") {
        const aValues = a._zod.def.values as readonly unknown[];
        const bValues = b._zod.def.values as readonly unknown[];
        if (aValues.length !== bValues.length) return false;
        // Treat as set equality of primitive literals
        const bSet = new Set(bValues);
        for (const v of aValues) {
          if (!bSet.has(v)) return false;
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare function",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      // Upgrade zod to v4.1 to resolve it
      // @ts-expect-error -- see https://github.com/colinhacks/zod/issues/4143
      if (aType === "function" && bType === "function") {
        // In Zod4, function def has `input` (tuple-like) and `output` (ZodType)
        return (
          // @ts-expect-error
          recheck(a._zod.def.input, b._zod.def.input) &&
          // @ts-expect-error
          recheck(a._zod.def.output, b._zod.def.output)
        );
      }
      return next();
    },
  },
  {
    name: "compare intersection",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "intersection" && bType === "intersection") {
        const aLeft = a._zod.def.left;
        const aRight = a._zod.def.right;
        const bLeft = b._zod.def.left;
        const bRight = b._zod.def.right;
        // Commutative: (L==L && R==R) OR (L==R && R==L)
        const direct = recheck(aLeft, bLeft) && recheck(aRight, bRight);
        if (direct) return true;
        const swapped = recheck(aLeft, bRight) && recheck(aRight, bLeft);
        return swapped;
      }
      return next();
    },
  },
  {
    name: "compare union",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "union" && bType === "union") {
        const aOpts = flatUnwrapUnion(a as $ZodUnion);
        const bOpts = flatUnwrapUnion(b as $ZodUnion);
        // Set-like equality (ignore duplicates): A ⊆ B and B ⊆ A
        const allAInB = aOpts.every((aOpt) =>
          bOpts.some((bOpt) => recheck(aOpt, bOpt)),
        );
        if (!allAInB) return false;
        const allBInA = bOpts.every((bOpt) =>
          aOpts.some((aOpt) => recheck(aOpt, bOpt)),
        );
        return allBInA;
      }
      return next();
    },
  },
  {
    name: "compare template_literal",
    compare: (a, b, next, recheck) => {
      const defA = a._zod.def;
      const defB = b._zod.def;
      if (
        defA.type === "template_literal" &&
        defB.type === "template_literal"
      ) {
        const aParts = defA.parts;
        const bParts = defB.parts;
        if (!Array.isArray(aParts) || !Array.isArray(bParts)) return false;
        if (aParts.length !== bParts.length) return false;
        for (let i = 0; i < aParts.length; i++) {
          const pa = aParts[i];
          const pb = bParts[i];
          const isSchemaA = isZodType(pa);
          const isSchemaB = isZodType(pb);
          if (isSchemaA || isSchemaB) {
            if (!(isSchemaA && isSchemaB)) return false;
            if (!recheck(pa, pb)) return false;
          } else {
            // Both should be primitive literal parts
            if (pa !== pb) return false;
          }
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare pipe",
    compare: (a, b, next, recheck) => {
      const defA = a._zod.def;
      const defB = b._zod.def;
      if (defA.type === "pipe" && defB.type === "pipe") {
        return recheck(defA.in, defB.in) && recheck(defA.out, defB.out);
      }
      return next();
    },
  },
  {
    name: "compare lazy",
    compare: (a, b, next, recheck) => {
      const aType = a._zod.def.type;
      const bType = b._zod.def.type;
      if (aType === "lazy" && bType === "lazy") {
        const aGetter = a._zod.def.getter;
        const bGetter = b._zod.def.getter;
        // Fast path: same getter function reference
        if (aGetter === bGetter) return true;
        const aInner = aGetter();
        const bInner = bGetter();
        if (!isZodType(aInner) || !isZodType(bInner)) return false;
        return recheck(aInner, bInner);
      }
      return next();
    },
  },
  // {
  //   name: "compare unknown schemas",
  //   compare: (a, b, _next, recheck) => {
  //     return compareSchemas(a, b, recheck);
  //   },
  // },
  {
    name: "final fallback",
    // ZodTransform
    compare: () => {
      return false;
    },
  },
] satisfies CompareRule[];

export const isSameType = createCompareFn(isSameTypePresetRules);
