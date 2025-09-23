import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { isSameType } from "../is-same-type.ts";

describe("isSameType", () => {
  test("should ref same type", () => {
    const uniqueType = z.string().brand("unique");
    expect(isSameType(uniqueType, uniqueType)).toBe(true);
  });

  test("compare basic type", () => {
    expect(isSameType(z.undefined(), z.undefined())).toBe(true);
    expect(isSameType(z.string(), z.string())).toBe(true);
    expect(isSameType(z.string(), z.number())).toBe(false);
    expect(isSameType(z.string().optional(), z.string())).toBe(false);
    expect(isSameType(z.string().optional(), z.string().optional())).toBe(true);
    expect(isSameType(z.string().nullable(), z.string().optional())).toBe(
      false,
    );
  });

  test("compare any/unknown type", () => {
    expect(isSameType(z.any(), z.any())).toBe(true);
    expect(isSameType(z.unknown(), z.unknown())).toBe(true);
    expect(isSameType(z.any(), z.unknown())).toBe(false);
  });

  test("should compare simple object", () => {
    expect(
      isSameType(
        z.object({
          name: z.string(),
        }),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(true);
    expect(
      isSameType(
        z.object({
          name: z.string(),
        }),
        z.object({
          name: z.number(),
        }),
      ),
    ).toBe(false);
    expect(
      isSameType(
        z
          .object({
            name: z.string(),
          })
          .partial(),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(false);
    expect(
      isSameType(
        z
          .object({
            name: z.string(),
          })
          .partial(),
        z
          .object({
            name: z.string(),
          })
          .partial(),
      ),
    ).toBe(true);
    expect(
      isSameType(
        z.object({
          name: z.string().nullable(),
        }),
        z.object({
          name: z.string().optional(),
        }),
      ),
    ).toBe(false);
    expect(
      isSameType(
        z.object({}),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(false);
  });

  test("should compare rest tuple", () => {
    expect(
      isSameType(
        z.tuple([z.string(), z.string()]),
        z.tuple([z.string(), z.string()]),
      ),
    ).toBe(true);
    expect(
      isSameType(
        z.tuple([z.string(), z.string()]),
        z.tuple([z.string(), z.number()]),
      ),
    ).toBe(false);
    expect(
      isSameType(
        z.tuple([z.string(), z.string()]).rest(z.number()),
        z.tuple([z.string(), z.string()]),
      ),
    ).toBe(false);
    expect(
      isSameType(
        z.tuple([z.string(), z.string()]).rest(z.number()),
        z.tuple([z.string(), z.string()]).rest(z.number()),
      ),
    ).toBe(true);

    expect(isSameType(z.tuple([]).rest(z.number()), z.array(z.number()))).toBe(
      false,
    );
  });

  test("should compare `and` type", () => {
    expect(
      isSameType(z.string().and(z.number()), z.string().and(z.number())),
    ).toBe(true);
    expect(
      isSameType(z.number().and(z.string()), z.number().and(z.string())),
    ).toBe(true);

    expect(
      isSameType(z.number().and(z.string()), z.string().and(z.number())),
    ).toBe(true);
  });

  test("should compare `or` type", () => {
    expect(
      isSameType(z.string().or(z.number()), z.string().or(z.number())),
    ).toBe(true);
    expect(
      isSameType(z.number().or(z.string()), z.number().or(z.string())),
    ).toBe(true);

    expect(
      isSameType(z.number().or(z.string()), z.string().or(z.number())),
    ).toBe(true);

    // should flat union type
    expect(
      isSameType(
        // (number | string) | boolean
        z.number().or(z.string()).or(z.boolean()),
        // (string | boolean) | number
        z.string().or(z.boolean()).or(z.number()),
      ),
    ).toBe(true);
  });

  test("should compare literal type", () => {
    expect(isSameType(z.literal("test"), z.literal("test"))).toBe(true);
    expect(isSameType(z.literal("test"), z.literal("test2"))).toBe(false);
  });

  test("should compare readonly type", () => {
    expect(
      isSameType(
        z.object({ foo: z.string().readonly() }),
        z.object({
          foo: z.string().readonly(),
        }),
      ),
    ).toBe(true);
    expect(isSameType(z.string().readonly(), z.string())).toBe(false);
  });
});

// See https://zod.dev/?id=coercion-for-primitives
describe("coerce", () => {
  test("can compare coerce type", () => {
    expect(isSameType(z.coerce.string(), z.coerce.number())).toBe(false);
    expect(isSameType(z.coerce.string(), z.number())).toBe(false);
    expect(isSameType(z.coerce.string(), z.coerce.string())).toBe(true);
    expect(isSameType(z.coerce.string(), z.coerce.string())).toBe(true);
  });

  test("can compare coerce type with normal type", () => {
    expect(isSameType(z.coerce.string(), z.string())).toBe(true);
    expect(isSameType(z.coerce.number(), z.number())).toBe(true);
  });
});
