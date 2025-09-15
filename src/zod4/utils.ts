import type {
  $ZodAny,
  $ZodBigInt,
  $ZodBoolean,
  $ZodDate,
  $ZodNaN,
  $ZodNever,
  $ZodNull,
  $ZodNumber,
  $ZodString,
  $ZodSymbol,
  $ZodType,
  $ZodTypes,
  $ZodUndefined,
  $ZodUnion,
  $ZodUnknown,
  $ZodVoid,
  SomeType,
} from "zod/v4/core";

export const isZodType = (maybeSchema: unknown): maybeSchema is $ZodType => {
  if (typeof maybeSchema !== "object" || maybeSchema === null) {
    return false;
  }
  if (
    !("~standard" in maybeSchema) ||
    typeof maybeSchema["~standard"] !== "object"
  ) {
    return false;
  }
  return (
    (maybeSchema["~standard"] as $ZodType["~standard"])["vendor"] === "zod"
  );
};

const typesSet: Set<string> = new Set([
  "string",
  "number",
  "boolean",
  "bigint",
  "symbol",
  "null",
  "undefined",
  "void",
  "never",
  "any",
  "unknown",
  "date",
  "object",
  "record",
  "file",
  "array",
  "tuple",
  "union",
  "intersection",
  "map",
  "set",
  "enum",
  "literal",
  "nullable",
  "optional",
  "nonoptional",
  "success",
  "transform",
  "default",
  "prefault",
  "catch",
  "nan",
  "pipe",
  "readonly",
  "template_literal",
  "promise",
  "lazy",
  "custom",
] satisfies $ZodTypes["_zod"]["def"]["type"][]);

export const isZodTypes = (schema: $ZodType): schema is $ZodTypes => {
  const type = schema._zod.def.type;
  return typesSet.has(type);
};

export const isSimpleType = (
  a: $ZodTypes,
): a is
  | $ZodString
  | $ZodNumber
  | $ZodBoolean
  | $ZodBigInt
  | $ZodSymbol
  | $ZodUndefined
  | $ZodNull
  | $ZodAny
  | $ZodUnknown
  | $ZodNever
  | $ZodVoid
  | $ZodDate
  | $ZodNaN => {
  const type = a._zod.def.type;
  return (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    type === "bigint" ||
    type === "symbol" ||
    type === "undefined" ||
    type === "null" ||
    type === "any" ||
    type === "unknown" ||
    type === "never" ||
    type === "void" ||
    type === "date" ||
    type === "nan" ||
    type === "file"
  );
};

export const flatUnwrapUnion = <
  Options extends readonly SomeType[] = readonly $ZodType[],
>(
  unionType: $ZodUnion<Options>,
): Options => {
  return unionType._zod.def.options.flatMap((x) => {
    if (
      x._zod.def.type === "union" &&
      Array.isArray((x as $ZodUnion)._zod.def.options)
    ) {
      return flatUnwrapUnion(x as $ZodUnion);
    }
    return x;
  }) as unknown as Options;
};

export const compareSchemas = (
  a: $ZodTypes,
  b: $ZodTypes,
  compareZod: (a: $ZodTypes, b: $ZodTypes) => boolean,
): boolean => {
  const aDef = a._zod.def;
  const bDef = b._zod.def;
  for (const key in aDef) {
    if (!(key in bDef)) return false;
    const aValue = aDef[key as keyof typeof aDef];
    const bValue = bDef[key as keyof typeof bDef];

    if (typeof aValue !== typeof bValue) return false;
    if (aValue === null && bValue !== null) return false;
    if (
      typeof aValue === "string" ||
      typeof aValue === "number" ||
      typeof aValue === "boolean" ||
      typeof aValue === "symbol" ||
      typeof aValue === "bigint" ||
      typeof aValue === "undefined"
    ) {
      if (aValue !== bValue) return false;
      continue;
    }
    if (isZodType(aValue)) {
      if (!isZodType(bValue)) return false;
      const isEqual = compareZod(
        aValue as unknown as $ZodTypes,
        bValue as unknown as $ZodTypes,
      );
      if (!isEqual) return false;
      continue;
    }
    if (Array.isArray(aValue)) {
      if (!Array.isArray(bValue)) return false;
      if (aValue.length !== bValue.length) return false;
      for (let i = 0; i < aValue.length; i++) {
        const aItem = aValue[i];
        const bItem = bValue[i];
        if (isZodType(aItem)) {
          if (!isZodType(bItem)) return false;
          if (!compareZod(aItem as $ZodTypes, bItem as $ZodTypes)) return false;
          continue;
        }
        if (aItem !== bItem) {
          return false;
        }
      }
      continue;
    }
    if (typeof aValue === "object") {
      if (typeof bValue !== "object" || bValue === null) return false;
      const bShape = bValue;
      if (Object.keys(aValue).length !== Object.keys(bShape).length)
        return false;
      console.warn("Skipping object comparison", key, aValue, bValue);
      continue;
    }
    if (typeof aValue === "function") {
      // skip function comparison
      console.warn("Skipping function comparison", key, aValue, bValue);
      continue;
    }
  }
  return true;
};
