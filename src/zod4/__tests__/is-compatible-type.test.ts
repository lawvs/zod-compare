import { describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod/v4";
import { isCompatibleType } from "../is-compatible-type.ts";

describe("isCompatibleType", () => {
  test("returns true for the same schema reference", () => {
    const uniqueType = z.string().brand("unique");
    expect(isCompatibleType(uniqueType, uniqueType)).toBe(true);
  });

  test("compares primitive and wrapper assignability", () => {
    expect(isCompatibleType(z.undefined(), z.undefined())).toBe(true);
    expect(isCompatibleType(z.string(), z.string())).toBe(true);
    expect(isCompatibleType(z.number(), z.string())).toBe(false);
    expect(isCompatibleType(z.string(), z.string().optional())).toBe(false);
    expect(isCompatibleType(z.string().optional(), z.string())).toBe(true);
    expect(isCompatibleType(z.string().optional(), z.string().optional())).toBe(
      true,
    );
    expect(isCompatibleType(z.string().optional(), z.string().nullable())).toBe(
      false,
    );
    expect(isCompatibleType(z.string().nullable(), z.string())).toBe(true);
    expect(isCompatibleType(z.string(), z.string().nullable())).toBe(false);
    expect(isCompatibleType(z.void(), z.undefined())).toBe(true);
    expect(isCompatibleType(z.undefined(), z.void())).toBe(false);
    expect(isCompatibleType(z.number(), z.nan())).toBe(true);
    expect(isCompatibleType(z.nan(), z.number())).toBe(true);
    expect(isCompatibleType(z.string().optional(), z.literal(undefined))).toBe(
      true,
    );
    expect(isCompatibleType(z.string().nullable(), z.literal(null))).toBe(true);
    expect(
      isCompatibleType(
        z.string().optional(),
        z.union([z.string(), z.undefined()]),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.string().optional(),
        z.union([z.string(), z.number(), z.undefined()]),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(z.string().nullable(), z.union([z.string(), z.null()])),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.string().nullable(),
        z.union([z.string(), z.number(), z.null()]),
      ),
    ).toBe(false);
  });

  test("does not treat promise inner nullish types as outer nullish values", () => {
    expect(isCompatibleType(z.string().nullable(), z.promise(z.null()))).toBe(
      false,
    );
    expect(
      isCompatibleType(z.string().optional(), z.promise(z.undefined())),
    ).toBe(false);
  });

  test("compares promise result types covariantly", () => {
    const expected = z.promise(z.string());
    const provided = z.promise(z.literal("value"));

    expectTypeOf<z.infer<typeof provided>>().toExtend<
      z.infer<typeof expected>
    >();
    expectTypeOf<z.infer<typeof expected>>().not.toExtend<
      z.infer<typeof provided>
    >();

    expect(isCompatibleType(expected, provided)).toBe(true);
    expect(isCompatibleType(provided, expected)).toBe(false);
  });

  test("compares TypeScript top, bottom, and any-like schemas", () => {
    expect(isCompatibleType(z.unknown(), z.string())).toBe(true);
    expect(isCompatibleType(z.string(), z.unknown())).toBe(false);

    expect(isCompatibleType(z.string(), z.never())).toBe(true);
    expect(isCompatibleType(z.never(), z.string())).toBe(false);

    expect(isCompatibleType(z.any(), z.string())).toBe(true);
    expect(isCompatibleType(z.string(), z.any())).toBe(true);
    expect(isCompatibleType(z.never(), z.any())).toBe(false);
  });

  test("compares object assignability with width subtyping", () => {
    expect(
      isCompatibleType(
        z.object({
          name: z.string(),
        }),
        z.object({
          name: z.string(),
          other: z.number(),
        }),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.object({
          name: z.number().nullable(),
        }),
        z.object({
          name: z.number(),
        }),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.object({
          name: z.string(),
        }),
        z
          .object({
            name: z.string().optional(),
          })
          .partial(),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        z
          .object({
            name: z.string(),
          })
          .partial(),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.object({
          name: z.string().optional(),
        }),
        z.object({
          name: z.string().nullable(),
        }),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        z.object({
          name: z.string(),
        }),
        z.object({}),
      ),
    ).toBe(false);
  });

  test("allows missing provided keys when expected keys are optional", () => {
    expect(
      isCompatibleType(
        z.object({
          name: z.string().optional(),
        }),
        z.object({}),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(
        z.object({
          name: z.string().nullable(),
        }),
        z.object({}),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(
        z.object({
          name: z.union([z.string(), z.undefined()]),
        }),
        z.object({}),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(
        z.object({
          name: z.undefined(),
        }),
        z.object({}),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(
        z.object({
          name: z.string().optional(),
        }),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(true);
  });

  test("combines object shapes when the provided type is an intersection", () => {
    const left = z.object({ a: z.string() });
    const right = z.object({ b: z.number() });
    const providedIntersection = z.intersection(left, right);
    const expectedConstituent = z.object({ a: z.string() });
    const expectedCombined = z.object({ a: z.string(), b: z.number() });
    const providedCombined = z.object({
      a: z.string(),
      b: z.number(),
      c: z.boolean(),
    });
    expectTypeOf<z.infer<typeof providedIntersection>>().toExtend<
      z.infer<typeof expectedConstituent>
    >();
    expectTypeOf<z.infer<typeof providedIntersection>>().toExtend<
      z.infer<typeof expectedCombined>
    >();
    expectTypeOf<z.infer<typeof providedCombined>>().toExtend<
      z.infer<typeof providedIntersection>
    >();
    expect(isCompatibleType(expectedConstituent, providedIntersection)).toBe(
      true,
    );
    expect(isCompatibleType(expectedCombined, providedIntersection)).toBe(true);
    expect(isCompatibleType(providedIntersection, providedCombined)).toBe(true);
    expect(isCompatibleType(providedIntersection, left)).toBe(false);
  });

  test("rejects a non-object intersection for a weak object target", () => {
    const expected = z.object({ a: z.string().optional() });
    const provided = z.intersection(z.object({}), z.string());
    const providedWithReadonlyObject = z.intersection(
      z.readonly(z.object({})),
      z.string(),
    );
    const providedWithObjectUnion = z.intersection(
      z.union([z.object({}), z.never()]),
      z.string(),
    );

    expectTypeOf<z.infer<typeof provided>>().not.toExtend<
      z.infer<typeof expected>
    >();
    expectTypeOf<z.infer<typeof providedWithReadonlyObject>>().not.toExtend<
      z.infer<typeof expected>
    >();
    expectTypeOf<z.infer<typeof providedWithObjectUnion>>().not.toExtend<
      z.infer<typeof expected>
    >();
    expect(isCompatibleType(expected, provided)).toBe(false);
    expect(isCompatibleType(expected, providedWithReadonlyObject)).toBe(false);
    expect(isCompatibleType(expected, providedWithObjectUnion)).toBe(false);
  });

  test("recognizes when an intersection infers never", () => {
    const provided = z.intersection(z.never(), z.string());

    expectTypeOf<z.infer<typeof provided>>().toEqualTypeOf<never>();
    expect(isCompatibleType(z.never(), provided)).toBe(true);
  });

  test("compares tuple assignability", () => {
    expect(
      isCompatibleType(
        z.tuple([z.string(), z.string()]),
        z.tuple([z.string()]),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(
        z.tuple([z.string(), z.number()]),
        z.tuple([z.string(), z.string()]),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(
        z.tuple([z.string()]).rest(z.number()),
        z.tuple([z.string()]),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(
        z.tuple([z.string()]).rest(z.number()),
        z.tuple([z.string(), z.number()]),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(
        z.tuple([z.string()]).rest(z.number()),
        z.tuple([z.string(), z.string()]),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(z.array(z.number()), z.tuple([]).rest(z.number())),
    ).toBe(true);

    expect(
      isCompatibleType(z.tuple([]).rest(z.number()), z.array(z.number())),
    ).toBe(true);
  });

  test("compares readonly assignability with TypeScript mutability rules", () => {
    const mutableArray = z.array(z.string());
    const readonlyArray = z.readonly(z.array(z.string()));
    const mutableTuple = z.tuple([z.string()]);
    const readonlyTuple = z.readonly(z.tuple([z.string()]));
    const mutableMap = z.map(z.string(), z.number());
    const readonlyMap = z.readonly(z.map(z.string(), z.number()));
    const mutableSet = z.set(z.string());
    const readonlySet = z.readonly(z.set(z.string()));
    const mutableObject = z.object({ value: z.string() });
    const readonlyObject = z.readonly(z.object({ value: z.string() }));
    const readonlyNever = z.readonly(z.never());

    expectTypeOf<z.infer<typeof mutableArray>>().toExtend<
      z.infer<typeof readonlyArray>
    >();
    expectTypeOf<z.infer<typeof readonlyArray>>().not.toExtend<
      z.infer<typeof mutableArray>
    >();
    expectTypeOf<z.infer<typeof mutableTuple>>().toExtend<
      z.infer<typeof readonlyTuple>
    >();
    expectTypeOf<z.infer<typeof readonlyTuple>>().not.toExtend<
      z.infer<typeof mutableTuple>
    >();
    expectTypeOf<z.infer<typeof mutableMap>>().toExtend<
      z.infer<typeof readonlyMap>
    >();
    expectTypeOf<z.infer<typeof readonlyMap>>().not.toExtend<
      z.infer<typeof mutableMap>
    >();
    expectTypeOf<z.infer<typeof mutableSet>>().toExtend<
      z.infer<typeof readonlySet>
    >();
    expectTypeOf<z.infer<typeof readonlySet>>().not.toExtend<
      z.infer<typeof mutableSet>
    >();
    expectTypeOf<z.infer<typeof readonlyObject>>().toExtend<
      z.infer<typeof mutableObject>
    >();
    expectTypeOf<z.infer<typeof readonlyNever>>().toEqualTypeOf<never>();
    expect(isCompatibleType(readonlyArray, mutableArray)).toBe(true);
    expect(isCompatibleType(mutableArray, readonlyArray)).toBe(false);
    expect(isCompatibleType(readonlyTuple, mutableTuple)).toBe(true);
    expect(isCompatibleType(mutableTuple, readonlyTuple)).toBe(false);
    expect(isCompatibleType(readonlyMap, mutableMap)).toBe(true);
    expect(isCompatibleType(mutableMap, readonlyMap)).toBe(false);
    expect(isCompatibleType(readonlySet, mutableSet)).toBe(true);
    expect(isCompatibleType(mutableSet, readonlySet)).toBe(false);
    expect(isCompatibleType(mutableObject, readonlyObject)).toBe(true);
    expect(isCompatibleType(z.unknown(), readonlyArray)).toBe(true);
    expect(isCompatibleType(z.never(), readonlyNever)).toBe(true);
  });

  test("preserves readonly through a provided union", () => {
    const mutableArray = z.array(z.unknown());
    const readonlyUnionOfArrays = z.readonly(
      z.union([z.array(z.string()), z.array(z.number())]),
    );

    expectTypeOf<z.infer<typeof readonlyUnionOfArrays>>().not.toExtend<
      z.infer<typeof mutableArray>
    >();

    expect(isCompatibleType(mutableArray, readonlyUnionOfArrays)).toBe(false);
  });

  test("preserves readonly while decomposing an expected intersection", () => {
    const readonlyArray = z.readonly(z.array(z.string()));
    const expectedReadonlyIntersection = z.intersection(
      z.readonly(z.array(z.string())),
      z.unknown(),
    );

    expectTypeOf<z.infer<typeof readonlyArray>>().toExtend<
      z.infer<typeof expectedReadonlyIntersection>
    >();

    expect(isCompatibleType(expectedReadonlyIntersection, readonlyArray)).toBe(
      true,
    );
  });

  test("compares union assignability", () => {
    expect(isCompatibleType(z.string().or(z.number()), z.string())).toBe(true);
    expect(
      isCompatibleType(z.number().or(z.string()).or(z.boolean()), z.string()),
    ).toBe(true);
    expect(isCompatibleType(z.string(), z.string().or(z.number()))).toBe(false);
    expect(
      isCompatibleType(
        z.number().or(z.string()).or(z.boolean()),
        z.string().or(z.number()),
      ),
    ).toBe(true);

    expect(isCompatibleType(z.string(), z.string().or(z.boolean()))).toBe(
      false,
    );
    expect(
      isCompatibleType(z.string().or(z.number()), z.string().or(z.boolean())),
    ).toBe(false);
  });

  test("compares record map and set assignability", () => {
    expect(
      isCompatibleType(
        z.record(z.string(), z.unknown()),
        z.record(z.string(), z.string()),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.record(z.string(), z.string()),
        z.record(z.string(), z.unknown()),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        z.record(z.number(), z.string()),
        z.record(z.string(), z.string()),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.record(z.string(), z.string()),
        z.record(z.number(), z.string()),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.record(z.enum(["a"]), z.string()),
        z.record(z.enum(["a", "b"]), z.string()),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.record(z.enum(["a", "b"]), z.string()),
        z.record(z.enum(["a"]), z.string()),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        z.record(z.enum(["a"]), z.string()),
        z.record(z.string(), z.string()),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(
        z.map(z.string(), z.unknown()),
        z.map(z.string(), z.string()),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.map(z.string(), z.string()),
        z.map(z.string(), z.unknown()),
      ),
    ).toBe(false);

    expect(isCompatibleType(z.set(z.unknown()), z.set(z.string()))).toBe(true);
    expect(isCompatibleType(z.set(z.string()), z.set(z.unknown()))).toBe(false);
  });

  test("compares enum and literal subset assignability", () => {
    enum NumericEnum {
      A,
      B,
    }

    expect(isCompatibleType(z.literal("a"), z.literal("a"))).toBe(true);
    expect(
      isCompatibleType(z.literal("a").or(z.literal("b")), z.literal("a")),
    ).toBe(true);
    expect(isCompatibleType(z.literal("a"), z.literal("b"))).toBe(false);

    expect(isCompatibleType(z.enum(["a", "b"]), z.enum(["a"]))).toBe(true);
    expect(isCompatibleType(z.enum(["a"]), z.enum(["a", "b"]))).toBe(false);

    expect(isCompatibleType(z.enum(["a", "b"]), z.literal("a"))).toBe(true);
    expect(isCompatibleType(z.literal("a"), z.enum(["a", "b"]))).toBe(false);
    expect(isCompatibleType(z.number(), z.enum(NumericEnum))).toBe(true);
    expect(isCompatibleType(z.enum(NumericEnum), z.literal(0))).toBe(true);
    expect(isCompatibleType(z.literal(0), z.enum(NumericEnum))).toBe(false);

    expect(isCompatibleType(z.string(), z.literal("a"))).toBe(true);
    expect(isCompatibleType(z.string(), z.enum(["a", "b"]))).toBe(true);
    expect(isCompatibleType(z.number(), z.literal(1))).toBe(true);
    expect(isCompatibleType(z.boolean(), z.literal(true))).toBe(true);
    expect(isCompatibleType(z.literal("a"), z.string())).toBe(false);
  });
});
