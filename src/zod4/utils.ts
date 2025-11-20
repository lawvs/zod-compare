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

export const zodToString = (
  schema: $ZodType,
  options?: { format?: boolean },
  indent = 0,
): string => {
  if (!isZodTypes(schema)) {
    return "z.unknown()";
  }
  const def = schema._zod.def;
  const type = def.type;
  const format = options?.format ?? false;
  const nextIndent = indent + 2;
  const indentStr = format ? "\n" + " ".repeat(nextIndent) : "";
  const endIndentStr = format ? "\n" + " ".repeat(indent) : "";

  switch (type) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "any":
    case "unknown":
    case "never":
    case "void":
    case "date":
    case "nan":
      return `z.${type}()`;
    case "literal":
      const values = def.values as unknown[];
      return `z.literal(${JSON.stringify(values[0])})`;
    case "array":
      return `z.array(${zodToString(def.element, options, indent)})`;
    case "object":
      const shape = def.shape;
      const shapeStrs = Object.entries(shape).map(
        ([k, v]) =>
          `${indentStr}${k}: ${zodToString(v as $ZodType, options, nextIndent)}`,
      );
      if (format) {
        return `z.object({${shapeStrs.join(",")}${endIndentStr}})`;
      }
      return `z.object({ ${shapeStrs.join(", ")} })`;
    case "tuple":
      const items = def.items as $ZodType[];
      const itemStrs = items.map((i) => zodToString(i, options, nextIndent));
      if (format && items.length > 0) {
        return `z.tuple([${indentStr}${itemStrs.join("," + indentStr)}${endIndentStr}])`;
      }
      return `z.tuple([${itemStrs.join(", ")}])`;
    case "union":
      const optionsList = def.options as $ZodType[];
      const optStrs = optionsList.map((o) =>
        zodToString(o, options, nextIndent),
      );
      if (format && optionsList.length > 0) {
        return `z.union([${indentStr}${optStrs.join("," + indentStr)}${endIndentStr}])`;
      }
      return `z.union([${optStrs.join(", ")}])`;
    case "intersection":
      return `z.intersection(${zodToString(def.left, options, indent)}, ${zodToString(
        def.right,
        options,
        indent,
      )})`;
    case "optional":
      return `${zodToString(def.innerType, options, indent)}.optional()`;
    case "nullable":
      return `${zodToString(def.innerType, options, indent)}.nullable()`;
    default:
      return `z.${type}(...)`;
  }
};
