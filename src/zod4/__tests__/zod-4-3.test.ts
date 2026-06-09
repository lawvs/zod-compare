import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { isCompatibleType } from "../is-compatible-type.ts";
import { isSameType } from "../is-same-type.ts";

describe("zod 4.3 support", () => {
  test("compares z.xor as an exclusive union", () => {
    const xorStringNumber = z.xor([z.string(), z.number()]);
    const xorNumberString = z.xor([z.number(), z.string()]);
    const inclusiveUnion = z.union([z.string(), z.number()]);

    expect(isSameType(xorStringNumber, xorNumberString)).toBe(true);
    expect(isSameType(xorStringNumber, inclusiveUnion)).toBe(false);

    expect(isCompatibleType(inclusiveUnion, xorStringNumber)).toBe(true);
    expect(isCompatibleType(xorStringNumber, inclusiveUnion)).toBe(false);
    expect(isCompatibleType(xorStringNumber, z.string())).toBe(true);
  });

  test("compares z.looseRecord separately from z.record", () => {
    const looseRecord = z.looseRecord(z.enum(["a", "b"]), z.string());
    const sameLooseRecord = z.looseRecord(z.enum(["b", "a"]), z.string());
    const exhaustiveRecord = z.record(z.enum(["a", "b"]), z.string());

    expect(isSameType(looseRecord, sameLooseRecord)).toBe(true);
    expect(isSameType(looseRecord, exhaustiveRecord)).toBe(false);

    expect(isCompatibleType(looseRecord, exhaustiveRecord)).toBe(true);
    expect(isCompatibleType(exhaustiveRecord, looseRecord)).toBe(false);
  });

  test("compares exact optionals separately from regular optionals", () => {
    const exactOptional = z.string().exactOptional();
    const sameExactOptional = z.string().exactOptional();
    const regularOptional = z.string().optional();

    expect(isSameType(exactOptional, sameExactOptional)).toBe(true);
    expect(isSameType(exactOptional, regularOptional)).toBe(false);

    expect(isCompatibleType(regularOptional, exactOptional)).toBe(true);
    expect(isCompatibleType(exactOptional, regularOptional)).toBe(false);
    expect(isCompatibleType(exactOptional, z.string())).toBe(true);
    expect(isCompatibleType(exactOptional, z.undefined())).toBe(false);
  });

  test("allows missing object keys for exact optional properties", () => {
    const expected = z.object({
      name: z.string().exactOptional(),
    });

    expect(isCompatibleType(expected, z.object({}))).toBe(true);
    expect(
      isCompatibleType(
        expected,
        z.object({
          name: z.string(),
        }),
      ),
    ).toBe(true);
    expect(
      isCompatibleType(
        expected,
        z.object({
          name: z.undefined(),
        }),
      ),
    ).toBe(false);
  });

  test("compares schemas created from JSON Schema", () => {
    const fromJsonSchema = z.fromJSONSchema({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    } as const);

    expect(isSameType(fromJsonSchema, z.object({ name: z.string() }))).toBe(
      true,
    );
  });

  test("ignores map size checks the same way other refinements are ignored", () => {
    const minMap = z.map(z.string(), z.number()).min(1);
    const maxMap = z.map(z.string(), z.number()).max(3);
    const nonemptyMap = z.map(z.string(), z.number()).nonempty();
    const sizedMap = z.map(z.string(), z.number()).size(2);

    expect(isSameType(minMap, maxMap)).toBe(true);
    expect(isSameType(nonemptyMap, sizedMap)).toBe(true);
    expect(isCompatibleType(minMap, maxMap)).toBe(true);
  });
});
