import { describe, expect, test } from "vitest";
import z from "zod/v3";
import { isSameType } from "../is-same-type.ts";

describe("zod4 specific test", () => {
  test("should return false when compare branded type", () => {
    expect(isSameType(z.string().brand("test"), z.string())).toBe(false);
    expect(isSameType(z.string().brand("test"), z.string().brand("test"))).toBe(
      false,
    );
    // expect(() =>
    //   isSameType(z.string().brand("test"), z.string().brand("test"))
    // ).toThrowError();
  });

  test("can compare coerce type with function", () => {
    expect(
      isSameType(
        z
          .function()
          .args(z.coerce.number(), z.coerce.string())
          .returns(z.boolean()),
        z
          .function()
          .args(z.coerce.number(), z.coerce.string())
          .returns(z.boolean()),
      ),
    ).toBe(true);
    expect(
      isSameType(
        z
          .function()
          .args(z.coerce.number(), z.coerce.string())
          .returns(z.boolean()),
        z.function().args(z.number(), z.string()).returns(z.boolean()),
      ),
    ).toBe(true);
  });
});
