import { z, type ZodType } from "zod";

export interface IsSameTypeOptions {
  deep: true;
  /**
   * Ignore all specific validations like min, max, length, email etc.
   *
   * You still can use `interceptor` to validate the type manually.
   */
  ignoreValidations: true;
  ignoreOptional: boolean;
  ignoreNullable: boolean;
  ignoreReadOnly: false;
  ignoreBranded: boolean;
  ignoreIntersectionsOrder: false;
  /**
   * A function that provides custom logic for comparing two ZodType instances.
   *
   * If the function returns `true` or `false`, the result will be used as the comparison result.
   * Otherwise, the default comparison logic will be used.
   *
   */
  interceptor: (
    a: ZodType,
    b: ZodType,
    options: IsSameTypeOptions,
  ) => boolean | void;
}

export interface IsCompatibleTypeOptions extends IsSameTypeOptions {
  ignoreOptional: false;
  ignoreNullable: false;
}

export const DEFAULT_COMPARE_TYPE_OPTIONS = {
  deep: true,
  ignoreOptional: false,
  ignoreNullable: false,
  ignoreReadOnly: false,
  ignoreBranded: false,
  ignoreValidations: true,
  ignoreIntersectionsOrder: false,
  interceptor: () => {},
} as const satisfies IsSameTypeOptions;

// See ZodFirstPartyTypeKind
export const isPrimitiveType = (a: ZodType): boolean => {
  return (
    a instanceof z.ZodString ||
    a instanceof z.ZodNumber ||
    a instanceof z.ZodNaN ||
    a instanceof z.ZodBigInt ||
    a instanceof z.ZodBoolean ||
    a instanceof z.ZodDate ||
    a instanceof z.ZodSymbol ||
    a instanceof z.ZodUndefined ||
    a instanceof z.ZodNull ||
    a instanceof z.ZodAny ||
    a instanceof z.ZodUnknown ||
    a instanceof z.ZodNever ||
    a instanceof z.ZodVoid
  );
};
