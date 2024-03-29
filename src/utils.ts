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

type Mutable<T> = { -readonly [k in keyof T]: T[k] };

export const flatUnwrapUnion = <
  T extends z.ZodUnionOptions = readonly [z.ZodTypeAny, ...z.ZodTypeAny[]],
>(
  t: z.ZodUnion<T>,
): Mutable<T> => {
  return t.options.flatMap((x) => {
    if (x instanceof z.ZodUnion) {
      return flatUnwrapUnion(x);
    }
    return x;
  }) as unknown as T;
};
