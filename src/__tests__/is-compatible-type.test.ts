import { describe, expect, test } from "vitest";
import { z } from "zod";
import { isCompatibleType } from "../is-compatible-type.ts";

describe("isCompatibleType", () => {
  test("should ref same type", () => {
    const uniqueType = z.string().brand("unique");
    expect(isCompatibleType(uniqueType, uniqueType)).toBe(true);
  });

  test("compare basic type", () => {
    expect(isCompatibleType(z.undefined(), z.undefined())).toBe(true);
    expect(isCompatibleType(z.string(), z.string())).toBe(true);
    expect(isCompatibleType(z.string(), z.number())).toBe(false);
    expect(isCompatibleType(z.string().optional(), z.string())).toBe(false);
    expect(isCompatibleType(z.string().optional(), z.string().optional())).toBe(
      true,
    );
    expect(isCompatibleType(z.string().nullable(), z.string().optional())).toBe(
      false,
    );
    expect(isCompatibleType(z.string(), z.string().nullable())).toBe(true);
    expect(isCompatibleType(z.string(), z.string().optional())).toBe(true);
  });

  test("should compare simple object", () => {
    expect(
      isCompatibleType(
        z.object({
          name: z.string(),
          other: z.number(),
        }),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.object({
          name: z.number(),
        }),
        z.object({
          name: z.number().nullable(),
        }),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z
          .object({
            name: z.string().optional(),
          })
          .partial(),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        z.object({
          name: z.string(),
        }),
        z
          .object({
            name: z.string(),
          })
          .partial(),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.object({
          name: z.string().nullable(),
        }),
        z.object({
          name: z.string().optional(),
        }),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        z.object({}),
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(false);
  });

  test("should compare rest tuple", () => {
    expect(
      isCompatibleType(
        z.tuple([z.string(), z.string()]),
        z.tuple([z.string()]),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.tuple([z.string(), z.string()]),
        z.tuple([z.string(), z.number()]),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        z.tuple([z.string(), z.string()]).rest(z.number()),
        z.tuple([z.string(), z.string()]),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        z.tuple([z.string()]),
        z.tuple([z.string()]).rest(z.number()),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(z.tuple([]).rest(z.number()), z.array(z.number())),
    ).toBe(false);
  });

  test("should compare `or` type", () => {
    expect(isCompatibleType(z.string(), z.string().or(z.number()))).toBe(true);
    expect(
      isCompatibleType(z.string(), z.number().or(z.string()).or(z.boolean())),
    ).toBe(true);
    expect(isCompatibleType(z.string().or(z.number()), z.string())).toBe(false);
    expect(
      isCompatibleType(
        z.string().or(z.number()),
        z.number().or(z.string()).or(z.boolean()),
      ),
    ).toBe(true);
  });
});
