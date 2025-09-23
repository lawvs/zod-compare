import type { $ZodFunction } from "zod/v4/core";

/**
 * Before zod v4.1, the $ZodFunction was not a Zod schema.
 * Learn more: https://github.com/colinhacks/zod/pull/5121/
 *
 * @deprecated Remove this union when we bump the zod version to v4.1+
 */
export type LegacyZodFunction = $ZodFunction;

/**
 * Checks if a schema is a legacy ZodFunction (pre-v4.1).
 *
 * Before zod v4.1, the $ZodFunction was not a Zod schema.
 * Learn more: https://github.com/colinhacks/zod/pull/5121/
 *
 * @deprecated Remove this function when we bump the zod version to v4.1+
 */
export const isLegacyZodFunction = (
  maybeSchema: unknown,
): maybeSchema is LegacyZodFunction => {
  if (typeof maybeSchema !== "object" || maybeSchema === null) {
    return false;
  }
  if ("_zod" in maybeSchema) {
    return false;
  }
  if (
    !("def" in maybeSchema) ||
    typeof maybeSchema["def"] !== "object" ||
    maybeSchema["def"] === null
  ) {
    return false;
  }
  if (
    !("type" in maybeSchema.def) ||
    typeof maybeSchema.def.type !== "string"
  ) {
    return false;
  }
  return (
    maybeSchema.def.type === "function" &&
    "input" in maybeSchema.def &&
    "output" in maybeSchema.def
  );
};
