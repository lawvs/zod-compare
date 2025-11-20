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
  // @ts-expect-error -- $ZodTypes includes function after v4.1
  "function",
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
