import type * as z3 from "zod/v3";
import type * as z4 from "zod/v4/core";

/**
 * See https://zod.dev/library-authors?id=how-to-support-zod-3-and-zod-4-simultaneously
 */
export const isZod4Schema = (
  schema: z3.ZodTypeAny | z4.$ZodType,
): schema is z3.ZodTypeAny => {
  if ("_zod" in schema) {
    // This is a Zod 4 schema
    // You can access the schema definition using `schema._zod.def`
    return true;
  } else {
    // This is a Zod 3 schema
    // You can access the schema definition using `schema._def`
    return false;
  }
};

export const isZod3Schema = (
  schema: z3.ZodTypeAny | z4.$ZodType,
): schema is z4.$ZodType => !isZod4Schema(schema);

export const checkSchemasVersionMatch = (
  schemaA: z3.ZodTypeAny | z4.$ZodType,
  schemaB: z3.ZodTypeAny | z4.$ZodType,
): boolean => {
  if (isZod3Schema(schemaA) && isZod3Schema(schemaB)) {
    return true; // Both are Zod 3 schemas
  }
  if (isZod4Schema(schemaA) && isZod4Schema(schemaB)) {
    return true; // Both are Zod 4 schemas
  }
  return false; // One is Zod 3 and the other is Zod 4
};
