import { expect, test } from "vitest";
import type { CompareContext } from "../legacy/types.ts";
import { runWithBothZodVersions } from "./test-utils.ts";

runWithBothZodVersions("isSameType", ({ zod, isSameType }) => {
  test("should ref same type", () => {
    const uniqueType = zod.string().brand("unique");
    expect(isSameType(uniqueType, uniqueType)).toBe(true);
  });

  test("compare basic type", () => {
    expect(isSameType(zod.undefined(), zod.undefined())).toBe(true);
    expect(isSameType(zod.string(), zod.string())).toBe(true);
    expect(isSameType(zod.string(), zod.number())).toBe(false);
    expect(isSameType(zod.string().optional(), zod.string())).toBe(false);
    expect(isSameType(zod.string().optional(), zod.string().optional())).toBe(true);
    expect(isSameType(zod.string().nullable(), zod.string().optional())).toBe(
      false,
    );
  });

  test("compare any/unknown type", () => {
    expect(isSameType(zod.any(), zod.any())).toBe(true);
    expect(isSameType(zod.unknown(), zod.unknown())).toBe(true);
    expect(isSameType(zod.any(), zod.unknown())).toBe(false);
  });

  test("should return false when compare branded type", () => {
    expect(isSameType(zod.string().brand("test"), zod.string())).toBe(false);
    expect(isSameType(zod.string(), zod.string().brand("test"))).toBe(false);
    expect(
      isSameType(zod.string().brand("test"), zod.string().brand("test")),
    ).toBe(true);
    expect(
      isSameType(zod.string().brand("test"), zod.string().brand("test2")),
    ).toBe(false);
  });

  test("should return false when compare optional type", () => {
    expect(isSameType(zod.string().optional(), zod.string())).toBe(false);
    expect(isSameType(zod.string(), zod.string().optional())).toBe(false);
  });

  test("should return false when compare nullable type", () => {
    expect(isSameType(zod.string().nullable(), zod.string())).toBe(false);
    expect(isSameType(zod.string(), zod.string().nullable())).toBe(false);
  });

  test("should compare simple object", () => {
    expect(
      isSameType(
        zod.object({
          name: zod.string(),
        }),
        zod.object({
          name: zod.string(),
        }),
      ),
    ).toBe(true);

    expect(
      isSameType(
        zod.object({
          name: zod.string(),
        }),
        zod.object({
          name: zod.string(),
          age: zod.number(),
        }),
      ),
    ).toBe(false);

    expect(
      isSameType(
        zod.object({
          name: zod.string(),
        }),
        zod.object({
          name: zod.number(),
        }),
      ),
    ).toBe(false);
  });

  test("should compare object with optional fields", () => {
    expect(
      isSameType(
        zod.object({
          name: zod.string(),
          age: zod.number().optional(),
        }),
        zod.object({
          name: zod.string(),
          age: zod.number().optional(),
        }),
      ),
    ).toBe(true);

    expect(
      isSameType(
        zod.object({
          name: zod.string(),
          age: zod.number().optional(),
        }),
        zod.object({
          name: zod.string(),
          age: zod.number(),
        }),
      ),
    ).toBe(false);
  });

  test("should compare complex object", () => {
    expect(
      isSameType(
        zod.object({
          name: zod.string(),
          info: zod.object({
            age: zod.number(),
            address: zod.string(),
          }),
        }),
        zod.object({
          name: zod.string(),
          info: zod.object({
            age: zod.number(),
            address: zod.string(),
          }),
        }),
      ),
    ).toBe(true);

    expect(
      isSameType(
        zod.object({
          name: zod.string(),
          info: zod.object({
            age: zod.number(),
          }),
        }),
        zod.object({
          name: zod.string(),
          info: zod.object({
            age: zod.number(),
            address: zod.string(),
          }),
        }),
      ),
    ).toBe(false);
  });

  test("should compare union", () => {
    const unionType = zod.union([zod.string(), zod.number()]);

    expect(isSameType(unionType, unionType)).toBe(true);
    expect(isSameType(unionType, zod.string())).toBe(false);
    expect(isSameType(zod.string(), unionType)).toBe(false);
    expect(
      isSameType(zod.union([zod.string()]), zod.union([zod.number()])),
    ).toBe(false);
  });

  test("should compare tuple", () => {
    expect(
      isSameType(
        zod.tuple([zod.string()]),
        zod.tuple([zod.string()]),
      ),
    ).toBe(true);

    expect(
      isSameType(zod.tuple([zod.string()]), zod.tuple([zod.number()])),
    ).toBe(false);
  });

  test("should compare array", () => {
    expect(isSameType(zod.array(zod.string()), zod.array(zod.string()))).toBe(
      true,
    );

    expect(isSameType(zod.array(zod.number()), zod.array(zod.string()))).toBe(
      false,
    );
  });

  test("should compare record", () => {
    expect(
      isSameType(zod.record(zod.string()), zod.record(zod.string())),
    ).toBe(true);
    expect(
      isSameType(zod.record(zod.number()), zod.record(zod.string())),
    ).toBe(false);
  });

  test("should compare map", () => {
    expect(
      isSameType(
        zod.map(zod.string(), zod.number()),
        zod.map(zod.string(), zod.number()),
      ),
    ).toBe(true);
    expect(
      isSameType(
        zod.map(zod.string(), zod.number()),
        zod.map(zod.number(), zod.number()),
      ),
    ).toBe(false);
    expect(
      isSameType(
        zod.map(zod.string(), zod.number()),
        zod.map(zod.string(), zod.string()),
      ),
    ).toBe(false);
  });

  test("should compare set", () => {
    expect(isSameType(zod.set(zod.string()), zod.set(zod.string()))).toBe(
      true,
    );
    expect(isSameType(zod.set(zod.string()), zod.set(zod.number()))).toBe(
      false,
    );
  });

  test("should compare enum", () => {
    expect(
      isSameType(zod.enum(["a", "b"]), zod.enum(["a", "b"])),
    ).toBe(true);
    expect(
      isSameType(zod.enum(["a", "b"]), zod.enum(["a", "c"])),
    ).toBe(false);
  });

  test("should compare literal", () => {
    expect(isSameType(zod.literal("a"), zod.literal("a"))).toBe(true);
    expect(isSameType(zod.literal("a"), zod.literal("b"))).toBe(false);
  });

  test("should compare discriminated union", () => {
    const discriminatedUnionA = zod.discriminatedUnion("type", [
      zod.object({ type: zod.literal("a"), a: zod.string() }),
      zod.object({ type: zod.literal("b"), b: zod.number() }),
    ]);

    const discriminatedUnionB = zod.discriminatedUnion("type", [
      zod.object({ type: zod.literal("a"), a: zod.string() }),
      zod.object({ type: zod.literal("b"), b: zod.number() }),
    ]);

    const discriminatedUnionC = zod.discriminatedUnion("type", [
      zod.object({ type: zod.literal("a"), a: zod.number() }),
      zod.object({ type: zod.literal("b"), b: zod.number() }),
    ]);

    expect(isSameType(discriminatedUnionA, discriminatedUnionB)).toBe(true);
    expect(isSameType(discriminatedUnionA, discriminatedUnionC)).toBe(false);
  });

  test("should compare with context", () => {
    const context: CompareContext = {
      stacks: [],
    };
    expect(
      isSameType(
        zod.object({ name: zod.string() }),
        zod.object({ name: zod.string() }),
        context,
      ),
    ).toBe(true);

    // Check stack length (should have entries)
    expect(context.stacks && context.stacks.length > 0).toBe(true);
  });
});
