import { describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod/v4";
import { isInferredAsNever } from "../inferred-type.ts";

describe("isInferredAsNever", () => {
  test("unwraps wrappers whose output preserves never", () => {
    const nonoptionalNever = z.never().nonoptional();
    const readonlyNever = z.never().readonly();

    expectTypeOf<z.infer<typeof nonoptionalNever>>().toEqualTypeOf<never>();
    expectTypeOf<z.infer<typeof readonlyNever>>().toEqualTypeOf<never>();

    expect(isInferredAsNever(nonoptionalNever)).toBe(true);
    expect(isInferredAsNever(readonlyNever)).toBe(true);
  });

  test("does not unwrap wrappers that add or replace output values", () => {
    const optionalNever = z.never().optional();
    const nullableNever = z.never().nullable();
    const successNever = z.success(z.never());
    const promiseNever = z.promise(z.never());

    expectTypeOf<z.infer<typeof optionalNever>>().toEqualTypeOf<undefined>();
    expectTypeOf<z.infer<typeof nullableNever>>().toEqualTypeOf<null>();
    expectTypeOf<z.infer<typeof successNever>>().toEqualTypeOf<boolean>();
    expectTypeOf<z.infer<typeof promiseNever>>().toEqualTypeOf<
      Promise<never>
    >();

    expect(isInferredAsNever(optionalNever)).toBe(false);
    expect(isInferredAsNever(nullableNever)).toBe(false);
    expect(isInferredAsNever(successNever)).toBe(false);
    expect(isInferredAsNever(promiseNever)).toBe(false);
  });
});
