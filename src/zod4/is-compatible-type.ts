import type { $ZodType, $ZodTypes, $ZodUnion } from "zod/v4/core";
import { createCompareFn } from "./create-compare-fn.ts";
import { isSameType } from "./is-same-type.ts";
import type { CompareRule } from "./types.ts";
import { flatUnwrapUnion, isZodType, isZodTypes } from "./utils.ts";

type PrimitiveKind = "undefined" | "null";

const getInnerType = (schema: $ZodTypes): $ZodTypes | undefined => {
  const def = schema._zod.def;
  if (
    "innerType" in def &&
    typeof def.innerType === "object" &&
    isZodType(def.innerType) &&
    isZodTypes(def.innerType)
  ) {
    return def.innerType;
  }
  return undefined;
};

const schemaAcceptsPrimitiveKind = (
  schema: $ZodType,
  primitiveKind: PrimitiveKind,
): boolean => {
  if (!isZodType(schema) || !isZodTypes(schema)) return false;

  const def = schema._zod.def;
  if (
    def.type === primitiveKind ||
    def.type === "any" ||
    def.type === "unknown"
  ) {
    return true;
  }

  if (def.type === "optional") {
    if (primitiveKind === "undefined") return true;
    const innerType = getInnerType(schema);
    return innerType
      ? schemaAcceptsPrimitiveKind(innerType, primitiveKind)
      : false;
  }

  if (def.type === "nullable") {
    if (primitiveKind === "null") return true;
    const innerType = getInnerType(schema);
    return innerType
      ? schemaAcceptsPrimitiveKind(innerType, primitiveKind)
      : false;
  }

  if (def.type === "union") {
    return flatUnwrapUnion(schema as $ZodUnion).some((option) =>
      schemaAcceptsPrimitiveKind(option, primitiveKind),
    );
  }

  return false;
};

const getFiniteLiteralValues = (
  schema: $ZodTypes,
): readonly unknown[] | undefined => {
  const def = schema._zod.def;
  if (def.type === "literal") {
    return def.values as readonly unknown[];
  }
  if (def.type === "enum") {
    return Object.values(def.entries as Record<string, unknown>);
  }
  return undefined;
};

const primitiveKindAcceptsValue = (
  primitiveKind: $ZodTypes["_zod"]["def"]["type"],
  value: unknown,
): boolean => {
  switch (primitiveKind) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !Number.isNaN(value);
    case "bigint":
      return typeof value === "bigint";
    case "boolean":
      return typeof value === "boolean";
    case "symbol":
      return typeof value === "symbol";
    case "undefined":
    case "void":
      return value === undefined;
    case "null":
      return value === null;
    case "nan":
      return typeof value === "number" && Number.isNaN(value);
    default:
      return false;
  }
};

export const isCompatibleTypePresetRules: CompareRule[] = [
  {
    name: "is same type",
    compare: (expectedType, providedType, next) => {
      if (isSameType(expectedType, providedType)) {
        return true;
      }
      return next();
    },
  },
  {
    name: "check typeName",
    compare: (expectedType, providedType, next) => {
      if (
        !isZodType(expectedType) ||
        !isZodTypes(expectedType) ||
        !isZodType(providedType) ||
        !isZodTypes(providedType)
      ) {
        throw new Error(
          "Failed to compare type! " + expectedType + " " + providedType,
        );
      }
      return next();
    },
  },
  {
    name: "check top bottom and any",
    compare: (expectedType, providedType, next) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;

      if (providedKind === "never") return true;
      if (expectedKind === "any" || expectedKind === "unknown") return true;
      if (expectedKind === "never") return false;
      if (providedKind === "unknown") return false;
      if (providedKind === "any") return true;

      return next();
    },
  },
  {
    name: "check optional/nullable on provided",
    compare: (expectedType, providedType, next, recheck) => {
      const providedDef = providedType._zod.def;
      if (providedDef.type === "optional" || providedDef.type === "nullable") {
        const innerType = getInnerType(providedType);
        if (!innerType) return false;
        const primitiveKind =
          providedDef.type === "optional" ? "undefined" : "null";
        return (
          recheck(expectedType, innerType) &&
          schemaAcceptsPrimitiveKind(expectedType, primitiveKind)
        );
      }
      return next();
    },
  },
  {
    name: "check optional/nullable on expected",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedDef = expectedType._zod.def;
      if (expectedDef.type === "optional" || expectedDef.type === "nullable") {
        const innerType = getInnerType(expectedType);
        if (!innerType) return false;
        const primitiveKind =
          expectedDef.type === "optional" ? "undefined" : "null";
        return (
          recheck(innerType, providedType) ||
          schemaAcceptsPrimitiveKind(providedType, primitiveKind)
        );
      }
      return next();
    },
  },
  {
    name: "check union",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind === "union" && providedKind === "union") {
        const expectedOptions = flatUnwrapUnion(expectedType as $ZodUnion);
        const providedOptions = flatUnwrapUnion(providedType as $ZodUnion);
        return providedOptions.every((providedOption) =>
          expectedOptions.some((expectedOption) =>
            recheck(expectedOption, providedOption),
          ),
        );
      }
      if (expectedKind === "union") {
        const expectedOptions = flatUnwrapUnion(expectedType as $ZodUnion);
        return expectedOptions.some((expectedOption) =>
          recheck(expectedOption, providedType),
        );
      }
      if (providedKind === "union") {
        const providedOptions = flatUnwrapUnion(providedType as $ZodUnion);
        return providedOptions.every((providedOption) =>
          recheck(expectedType, providedOption),
        );
      }
      return next();
    },
  },
  {
    name: "check finite literal values",
    compare: (expectedType, providedType, next) => {
      const expectedValues = getFiniteLiteralValues(expectedType);
      const providedValues = getFiniteLiteralValues(providedType);
      if (!expectedValues && providedValues) {
        const expectedKind = expectedType._zod.def.type;
        if (
          providedValues.every((value) =>
            primitiveKindAcceptsValue(expectedKind, value),
          )
        ) {
          return true;
        }
      }
      if (expectedValues || providedValues) {
        if (!expectedValues || !providedValues) return next();
        const expectedSet = new Set(expectedValues);
        return providedValues.every((value) => expectedSet.has(value));
      }
      return next();
    },
  },
  {
    name: "check array tuple cross compatibility",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;

      if (expectedKind === "array" && providedKind === "tuple") {
        const expectedElement = expectedType._zod.def.element;
        const providedItems = providedType._zod.def.items;
        for (const item of providedItems) {
          if (!recheck(expectedElement, item)) return false;
        }
        const providedRest = providedType._zod.def.rest;
        return providedRest ? recheck(expectedElement, providedRest) : true;
      }

      if (expectedKind === "tuple" && providedKind === "array") {
        const expectedItems = expectedType._zod.def.items;
        const expectedRest = expectedType._zod.def.rest;
        if (expectedItems.length > 0 || !expectedRest) return false;
        return recheck(expectedRest, providedType._zod.def.element);
      }

      return next();
    },
  },
  {
    name: "compare type by kind",
    compare: (expectedType, providedType, next) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind !== providedKind) return false;
      return next();
    },
  },
  {
    name: "check object (structural assignability)",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind === "object" && providedKind === "object") {
        const expectedShape = expectedType._zod.def.shape;
        const providedShape = providedType._zod.def.shape;
        for (const key in expectedShape) {
          if (!(key in providedShape)) {
            if (!schemaAcceptsPrimitiveKind(expectedShape[key], "undefined")) {
              return false;
            }
            continue;
          }
          if (!recheck(expectedShape[key], providedShape[key])) return false;
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "check array",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind === "array" && providedKind === "array") {
        return recheck(
          expectedType._zod.def.element,
          providedType._zod.def.element,
        );
      }
      return next();
    },
  },
  {
    name: "check tuple (length and rest)",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind === "tuple" && providedKind === "tuple") {
        const expectedItems = expectedType._zod.def.items;
        const providedItems = providedType._zod.def.items;
        const expectedRest = expectedType._zod.def.rest;
        const providedRest = providedType._zod.def.rest;

        if (providedItems.length < expectedItems.length) return false;
        for (let i = 0; i < expectedItems.length; i++) {
          if (!recheck(expectedItems[i], providedItems[i])) return false;
        }
        if (providedItems.length > expectedItems.length) {
          if (!expectedRest) return false;
          for (let i = expectedItems.length; i < providedItems.length; i++) {
            if (!recheck(expectedRest, providedItems[i])) return false;
          }
        }
        if (providedRest) {
          if (!expectedRest) return false;
          return recheck(expectedRest, providedRest);
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "check record",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind === "record" && providedKind === "record") {
        return (
          recheck(
            expectedType._zod.def.keyType,
            providedType._zod.def.keyType,
          ) &&
          recheck(
            expectedType._zod.def.valueType,
            providedType._zod.def.valueType,
          )
        );
      }
      return next();
    },
  },
  {
    name: "check map",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind === "map" && providedKind === "map") {
        return (
          recheck(
            expectedType._zod.def.keyType,
            providedType._zod.def.keyType,
          ) &&
          recheck(
            expectedType._zod.def.valueType,
            providedType._zod.def.valueType,
          )
        );
      }
      return next();
    },
  },
  {
    name: "check set",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;
      if (expectedKind === "set" && providedKind === "set") {
        return recheck(
          expectedType._zod.def.valueType,
          providedType._zod.def.valueType,
        );
      }
      return next();
    },
  },
  {
    name: "final fallback",
    compare: () => false,
  },
];

/**
 * Check whether `providedType` is assignable to `expectedType`.
 *
 * Returns true when `providedType <= expectedType`, i.e. every value accepted by
 * `providedType` can be used where `expectedType` is expected.
 *
 * @experimental This API is unstable and still in development.
 *
 * @param expectedType The wider/supertype schema.
 * @param providedType The narrower/subtype schema.
 *
 * @example
 * ```ts
 * isCompatibleType(z.string(), z.string()); // true
 *
 * isCompatibleType(
 *   z.object({ name: z.string() }),
 *   z.object({ name: z.string(), other: z.number() }),
 * );
 * // true
 * ```
 */
export const isCompatibleType = createCompareFn(isCompatibleTypePresetRules);
