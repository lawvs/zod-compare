import { expect, test } from "vitest";
import { runWithBothZodVersions } from "./test-utils.ts";

runWithBothZodVersions("isCompatibleType", ({ zod, isCompatibleType }) => {
  test("should ref same type", () => {
    const uniqueType = zod.string().brand("unique");
    expect(isCompatibleType(uniqueType, uniqueType)).toBe(true);
  });

  test("compare basic type", () => {
    expect(isCompatibleType(zod.undefined(), zod.undefined())).toBe(true);
    expect(isCompatibleType(zod.string(), zod.string())).toBe(true);
    expect(isCompatibleType(zod.string(), zod.number())).toBe(false);
    expect(isCompatibleType(zod.string().optional(), zod.string())).toBe(false);
    expect(isCompatibleType(zod.string().optional(), zod.string().optional())).toBe(
      true,
    );
    expect(isCompatibleType(zod.string().nullable(), zod.string().optional())).toBe(
      false,
    );
    expect(isCompatibleType(zod.string(), zod.string().nullable())).toBe(true);
    expect(isCompatibleType(zod.string(), zod.string().optional())).toBe(true);
  });

  test("should compare simple object", () => {
    expect(
      isCompatibleType(
        zod.object({
          name: zod.string(),
        }),
        zod.object({
          name: zod.string(),
        }),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(
        zod.object({
          name: zod.string(),
        }),
        zod.object({
          name: zod.string(),
          age: zod.number(),
        }),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(
        zod.object({
          name: zod.string(),
          age: zod.number(),
        }),
        zod.object({
          name: zod.string(),
        }),
      ),
    ).toBe(false);

    expect(
      isCompatibleType(
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
      isCompatibleType(
        zod.object({
          name: zod.string(),
          age: zod.number().optional(),
        }),
        zod.object({
          name: zod.string(),
          age: zod.number(),
        }),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(
        zod.object({
          name: zod.string(),
          age: zod.number(),
        }),
        zod.object({
          name: zod.string(),
          age: zod.number().optional(),
        }),
      ),
    ).toBe(false);
  });

  test("should compare complex object", () => {
    expect(
      isCompatibleType(
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
      isCompatibleType(
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
    ).toBe(true);

    expect(
      isCompatibleType(
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
          }),
        }),
      ),
    ).toBe(false);
  });

  test("should compare union", () => {
    const unionType = zod.union([zod.string(), zod.number()]);

    expect(isCompatibleType(unionType, unionType)).toBe(true);
    expect(isCompatibleType(unionType, zod.string())).toBe(false);
    expect(isCompatibleType(zod.string(), unionType)).toBe(true);
    expect(
      isCompatibleType(zod.union([zod.string()]), zod.union([zod.number()])),
    ).toBe(false);
  });

  test("should compare tuple", () => {
    expect(
      isCompatibleType(
        zod.tuple([zod.string()]),
        zod.tuple([zod.string()]),
      ),
    ).toBe(true);

    expect(
      isCompatibleType(zod.tuple([zod.string()]), zod.tuple([zod.number()])),
    ).toBe(false);
  });

  test("should compare array", () => {
    expect(isCompatibleType(zod.array(zod.string()), zod.array(zod.string()))).toBe(
      true,
    );

    expect(isCompatibleType(zod.array(zod.number()), zod.array(zod.string()))).toBe(
      false,
    );
  });

  test("should compare record", () => {
    expect(
      isCompatibleType(zod.record(zod.string()), zod.record(zod.string())),
    ).toBe(true);
    expect(
      isCompatibleType(zod.record(zod.number()), zod.record(zod.string())),
    ).toBe(false);
  });

  test("should compare map", () => {
    expect(
      isCompatibleType(
        zod.map(zod.string(), zod.number()),
        zod.map(zod.string(), zod.number()),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        zod.map(zod.string(), zod.number()),
        zod.map(zod.number(), zod.number()),
      ),
    ).toBe(false);
    expect(
      isCompatibleType(
        zod.map(zod.string(), zod.number()),
        zod.map(zod.string(), zod.string()),
      ),
    ).toBe(false);
  });

  test("should compare set", () => {
    expect(isCompatibleType(zod.set(zod.string()), zod.set(zod.string()))).toBe(
      true,
    );
    expect(isCompatibleType(zod.set(zod.string()), zod.set(zod.number()))).toBe(
      false,
    );
  });

  test("should compare enum", () => {
    expect(
      isCompatibleType(zod.enum(["a", "b"]), zod.enum(["a", "b"])),
    ).toBe(true);
    expect(
      isCompatibleType(zod.enum(["a", "b"]), zod.enum(["a", "c"])),
    ).toBe(false);
  });

  test("should compare literal", () => {
    expect(isCompatibleType(zod.literal("a"), zod.literal("a"))).toBe(true);
    expect(isCompatibleType(zod.literal("a"), zod.literal("b"))).toBe(false);
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

    expect(isCompatibleType(discriminatedUnionA, discriminatedUnionB)).toBe(true);
    expect(isCompatibleType(discriminatedUnionA, discriminatedUnionC)).toBe(false);
  });
});
