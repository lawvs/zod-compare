import type { $ZodType, $ZodTypes, $ZodUnion } from "zod/v4/core";
import {
  flatUnwrapUnion,
  getInnerType,
  isZodType,
  isZodTypes,
} from "./utils.ts";

export const isInferredAsNever = (schema: $ZodTypes): boolean => {
  const def = schema._zod.def;
  if (def.type === "never") return true;
  if (
    def.type === "default" ||
    def.type === "prefault" ||
    def.type === "nonoptional" ||
    def.type === "catch" ||
    def.type === "readonly"
  ) {
    return isZodTypes(def.innerType) && isInferredAsNever(def.innerType);
  }
  if (def.type === "intersection") {
    return (
      (isZodTypes(def.left) && isInferredAsNever(def.left)) ||
      (isZodTypes(def.right) && isInferredAsNever(def.right))
    );
  }
  if (def.type !== "union") return false;

  const options = flatUnwrapUnion(schema as $ZodUnion);
  return (
    options.length === 0 ||
    options.every((option) => isZodTypes(option) && isInferredAsNever(option))
  );
};

export const schemaAcceptsUndefined = (schema: $ZodType): boolean => {
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

export const schemaAcceptsNull = (schema: $ZodType): boolean => {
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
export const schemaAllowsMissingObjectKey = (schema: $ZodType): boolean => {
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
export const getFiniteLiteralValues = (
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
