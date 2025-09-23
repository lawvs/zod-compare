import { z, type ZodType } from "zod/v3";

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
