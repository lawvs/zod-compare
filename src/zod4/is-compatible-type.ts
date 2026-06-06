import type { $ZodType, $ZodTypes, $ZodUnion } from "zod/v4/core";
import { createCompareFn } from "./create-compare-fn.ts";
import { isSameType } from "./is-same-type.ts";
import type { CompareRule } from "./types.ts";
import { flatUnwrapUnion, isZodType, isZodTypes } from "./utils.ts";

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

const schemaAcceptsUndefined = (schema: $ZodType): boolean => {
  if (!isZodType(schema) || !isZodTypes(schema)) return false;

  const def = schema._zod.def;
  if (
    def.type === "undefined" ||
    def.type === "any" ||
    def.type === "unknown"
  ) {
    return true;
  }

  if (def.type === "literal") {
    return def.values.includes(undefined);
  }

  if (def.type === "optional") {
    return true;
  }

  if (def.type === "nullable") {
    const innerType = getInnerType(schema);
    return innerType ? schemaAcceptsUndefined(innerType) : false;
  }

  if (def.type === "union") {
    return flatUnwrapUnion(schema as $ZodUnion).some((option) =>
      schemaAcceptsUndefined(option),
    );
  }

  return false;
};

const schemaAcceptsNull = (schema: $ZodType): boolean => {
  if (!isZodType(schema) || !isZodTypes(schema)) return false;

  const def = schema._zod.def;
  if (def.type === "null" || def.type === "any" || def.type === "unknown") {
    return true;
  }

  if (def.type === "literal") {
    return def.values.includes(null);
  }

  if (def.type === "optional") {
    const innerType = getInnerType(schema);
    return innerType ? schemaAcceptsNull(innerType) : false;
  }

  if (def.type === "nullable") {
    return true;
  }

  if (def.type === "union") {
    return flatUnwrapUnion(schema as $ZodUnion).some((option) =>
      schemaAcceptsNull(option),
    );
  }

  return false;
};

/**
 * Checks whether an object property may be omitted for the inferred TypeScript
 * object type.
 *
 * This is narrower than accepting `undefined` as a value. For example,
 * `z.union([z.string(), z.undefined()])` accepts `undefined`, but still infers a
 * required property when used in `z.object({ key: ... })`.
 */
const schemaAllowsMissingObjectKey = (schema: $ZodType): boolean => {
  if (!isZodType(schema) || !isZodTypes(schema)) return false;

  const def = schema._zod.def;
  if (def.type === "optional") {
    return true;
  }

  if (def.type === "nullable") {
    const innerType = getInnerType(schema);
    return innerType ? schemaAllowsMissingObjectKey(innerType) : false;
  }

  return false;
};

const getEnumValues = (
  entries: Record<string, unknown>,
): readonly unknown[] => {
  const values = Object.entries(entries)
    .filter(([key, value]) => {
      if (typeof value !== "string") return true;
      const numericKey = Number(key);
      return !(
        Number.isFinite(numericKey) && Object.is(entries[value], numericKey)
      );
    })
    .map(([, value]) => value);
  return Array.from(new Set(values));
};

/**
 * Extracts the finite value set represented by literal and enum schemas.
 *
 * These values can be compared with subset logic before falling back to broader
 * kind rules.
 */
const getFiniteLiteralValues = (
  schema: $ZodTypes,
): readonly unknown[] | undefined => {
  const def = schema._zod.def;
  if (def.type === "literal") {
    return def.values;
  }
  if (def.type === "enum") {
    return getEnumValues(def.entries);
  }
  return undefined;
};

const recordKeysAreCompatible = (
  expectedKeyType: $ZodType,
  providedKeyType: $ZodType,
  recheck: (expectedType: $ZodType, providedType: $ZodType) => boolean,
): boolean => {
  const expectedKind = expectedKeyType._zod.def.type;
  const providedKind = providedKeyType._zod.def.type;

  if (
    (expectedKind === "string" && providedKind === "number") ||
    (expectedKind === "number" && providedKind === "string")
  ) {
    return true;
  }

  const expectedValues = isZodTypes(expectedKeyType)
    ? getFiniteLiteralValues(expectedKeyType)
    : undefined;
  const providedValues = isZodTypes(providedKeyType)
    ? getFiniteLiteralValues(providedKeyType)
    : undefined;

  if (expectedValues && providedValues) {
    const providedSet = new Set(providedValues);
    return expectedValues.every((value) => providedSet.has(value));
  }

  if (expectedValues && isZodTypes(providedKeyType)) {
    return expectedValues.every((value) => {
      switch (providedKind) {
        case "string":
          return typeof value === "string";
        case "number":
          return typeof value === "number";
        case "symbol":
          return typeof value === "symbol";
        default:
          return false;
      }
    });
  }

  return recheck(expectedKeyType, providedKeyType);
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
      if (providedDef.type === "optional") {
        const innerType = getInnerType(providedType);
        if (!innerType) return false;
        return (
          recheck(expectedType, innerType) &&
          schemaAcceptsUndefined(expectedType)
        );
      }
      if (providedDef.type === "nullable") {
        const innerType = getInnerType(providedType);
        if (!innerType) return false;
        return (
          recheck(expectedType, innerType) && schemaAcceptsNull(expectedType)
        );
      }
      return next();
    },
  },
  {
    name: "check optional/nullable on expected",
    compare: (expectedType, providedType, next, recheck) => {
      const expectedDef = expectedType._zod.def;
      if (expectedDef.type === "optional") {
        const innerType = getInnerType(expectedType);
        if (!innerType) return false;
        if (providedType._zod.def.type === "union") {
          return flatUnwrapUnion(providedType as $ZodUnion).every((option) =>
            recheck(expectedType, option),
          );
        }
        return (
          recheck(innerType, providedType) ||
          schemaAcceptsUndefined(providedType)
        );
      }
      if (expectedDef.type === "nullable") {
        const innerType = getInnerType(expectedType);
        if (!innerType) return false;
        if (providedType._zod.def.type === "union") {
          return flatUnwrapUnion(providedType as $ZodUnion).every((option) =>
            recheck(expectedType, option),
          );
        }
        return (
          recheck(innerType, providedType) || schemaAcceptsNull(providedType)
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
    name: "check finite literal subset",
    compare: (expectedType, providedType, next) => {
      const expectedValues = getFiniteLiteralValues(expectedType);
      const providedValues = getFiniteLiteralValues(providedType);

      if (!expectedValues || !providedValues) {
        return next();
      }

      const expectedSet = new Set(expectedValues);
      return providedValues.every((value) => expectedSet.has(value));
    },
  },
  {
    name: "check finite literal to primitive",
    compare: (expectedType, providedType, next) => {
      const expectedValues = getFiniteLiteralValues(expectedType);
      const providedValues = getFiniteLiteralValues(providedType);
      if (expectedValues || !providedValues) return next();

      const expectedKind = expectedType._zod.def.type;
      return providedValues.every((value) => {
        switch (expectedKind) {
          case "string":
            return typeof value === "string";
          case "number":
          case "nan":
            return typeof value === "number";
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
          default:
            return false;
        }
      });
    },
  },
  {
    name: "check primitive assignability",
    compare: (expectedType, providedType, next) => {
      const expectedKind = expectedType._zod.def.type;
      const providedKind = providedType._zod.def.type;

      if (expectedKind === "void" && providedKind === "undefined") {
        return true;
      }

      if (
        (expectedKind === "number" || expectedKind === "nan") &&
        (providedKind === "number" || providedKind === "nan")
      ) {
        return true;
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
            if (!schemaAllowsMissingObjectKey(expectedShape[key])) {
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
          recordKeysAreCompatible(
            expectedType._zod.def.keyType,
            providedType._zod.def.keyType,
            recheck,
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
