import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { z } from "zod/v4";
import { isCompatibleType } from "../is-compatible-type.ts";
import { isSameType } from "../is-same-type.ts";

describe("zod 4.4 support", () => {
  test("treats empty union and empty xor as never", () => {
    const emptyUnion = z.union([]);
    const emptyXor = z.xor([]);

    expectTypeOf<z.infer<typeof emptyUnion>>().toEqualTypeOf<never>();
    expectTypeOf<z.infer<typeof emptyXor>>().toEqualTypeOf<never>();

    expect(isSameType(emptyUnion, z.never())).toBe(true);
    expect(isSameType(emptyXor, z.never())).toBe(true);
    expect(isSameType(z.never(), emptyUnion)).toBe(true);
    expect(isSameType(z.never(), emptyXor)).toBe(true);
    expect(isSameType(emptyUnion, emptyXor)).toBe(true);

    expect(isCompatibleType(z.string(), emptyUnion)).toBe(true);
    expect(isCompatibleType(z.string(), emptyXor)).toBe(true);
    expect(isCompatibleType(z.never(), emptyUnion)).toBe(true);
    expect(isCompatibleType(z.never(), emptyXor)).toBe(true);

    expect(isCompatibleType(emptyUnion, z.string())).toBe(false);
    expect(isCompatibleType(emptyXor, z.string())).toBe(false);
  });

  test("keeps z.undefined object properties required", () => {
    const expected = z.object({
      value: z.undefined(),
    });

    expectTypeOf<{}>().not.toExtend<z.infer<typeof expected>>();
    expectTypeOf<{ value: undefined }>().toExtend<z.infer<typeof expected>>();

    expect(isCompatibleType(expected, z.object({}))).toBe(false);
    expect(
      isCompatibleType(
        expected,
        z.object({
          value: z.undefined(),
        }),
      ),
    ).toBe(true);
  });

  test("warns for pipe even though same-type structure comparison is supported", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(
        isSameType(z.string().pipe(z.string()), z.string().pipe(z.string())),
      ).toBe(true);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("[zod-compare] Runtime-only schema detected."),
      );
    } finally {
      warn.mockRestore();
    }
  });
});
