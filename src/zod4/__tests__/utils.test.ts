import { describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod/v4";
import { schemaInfersNever, zodToString } from "../utils.ts";

describe("schemaInfersNever", () => {
  const throwNever = (): never => {
    throw new Error("unreachable");
  };

  test("unwraps wrappers whose output preserves never", () => {
    const defaultNever = z.never().default(throwNever);
    const prefaultNever = z.never().prefault(throwNever);
    const nonoptionalNever = z.never().nonoptional();
    const catchNever = z.never().catch(throwNever);
    const readonlyNever = z.never().readonly();

    expectTypeOf<z.infer<typeof defaultNever>>().toEqualTypeOf<never>();
    expectTypeOf<z.infer<typeof prefaultNever>>().toEqualTypeOf<never>();
    expectTypeOf<z.infer<typeof nonoptionalNever>>().toEqualTypeOf<never>();
    expectTypeOf<z.infer<typeof catchNever>>().toEqualTypeOf<never>();
    expectTypeOf<z.infer<typeof readonlyNever>>().toEqualTypeOf<never>();

    expect(schemaInfersNever(defaultNever)).toBe(true);
    expect(schemaInfersNever(prefaultNever)).toBe(true);
    expect(schemaInfersNever(nonoptionalNever)).toBe(true);
    expect(schemaInfersNever(catchNever)).toBe(true);
    expect(schemaInfersNever(readonlyNever)).toBe(true);
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

    expect(schemaInfersNever(optionalNever)).toBe(false);
    expect(schemaInfersNever(nullableNever)).toBe(false);
    expect(schemaInfersNever(successNever)).toBe(false);
    expect(schemaInfersNever(promiseNever)).toBe(false);
  });
});

describe("zodToString", () => {
  test("simple types", () => {
    expect(zodToString(z.string())).toBe("z.string()");
    expect(zodToString(z.number())).toBe("z.number()");
    expect(zodToString(z.boolean())).toBe("z.boolean()");
    expect(zodToString(z.null())).toBe("z.null()");
    expect(zodToString(z.undefined())).toBe("z.undefined()");
  });

  test("object", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    expect(zodToString(schema)).toBe(
      "z.object({ name: z.string(), age: z.number() })",
    );
  });

  test("nested object", () => {
    const schema = z.object({
      user: z.object({
        id: z.number(),
      }),
    });
    expect(zodToString(schema)).toBe(
      "z.object({ user: z.object({ id: z.number() }) })",
    );
  });

  test("array", () => {
    expect(zodToString(z.array(z.string()))).toBe("z.array(z.string())");
  });

  test("optional", () => {
    expect(zodToString(z.string().optional())).toBe("z.string().optional()");
  });

  test("formatted object", () => {
    const schema = z.object({
      user: z.object({
        id: z.number(),
      }),
    });
    const expected = `z.object({
  user: z.object({
    id: z.number()
  })
})`;
    expect(zodToString(schema, { format: true })).toBe(expected);
  });
});
