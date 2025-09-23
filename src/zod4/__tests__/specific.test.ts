import { describe, expect, test } from "vitest";
import z from "zod/v4";
import { isSameType } from "../is-same-type.ts";

describe("zod4 specific test", () => {
  // In Zod4, the brands are implemented as static-only construct,
  // we can not identify them in runtime.
  // Learn more https://github.com/colinhacks/zod/issues/2480#issuecomment-3115434910
  test("zod4 can not distinguish between branded and unbranded types", () => {
    expect(isSameType(z.string().brand("test"), z.string())).toBe(true);
    expect(isSameType(z.string().brand("test"), z.string().brand("test"))).toBe(
      true,
    );
  });

  // In Zod4, The result of z.function() is no longer a Zod schema.
  // Instead, it acts as a standalone "function factory" for defining Zod-validated functions.
  // See https://github.com/colinhacks/zod/issues/4143
  test("can compare function type", () => {
    expect(
      isSameType(
        z.function({
          input: [z.number(), z.string()],
          output: z.boolean(),
        }),
        z.function({
          input: [z.number(), z.string()],
          output: z.boolean(),
        }),
      ),
    ).toBe(true);

    expect(
      isSameType(
        z.function({
          input: [z.string(), z.number()],
          output: z.boolean(),
        }),
        z.function({
          input: [z.number(), z.string()],
          output: z.boolean(),
        }),
      ),
    ).toBe(false);

    expect(
      isSameType(
        z.string(),
        z.function({
          input: [z.number(), z.string()],
          output: z.boolean(),
        }),
      ),
    ).toBe(false);
  });

  test("can compare coerce type with function", () => {
    expect(
      isSameType(
        z.function({
          input: [z.coerce.number(), z.coerce.string()],
          output: z.boolean(),
        }),
        z.function({
          input: [z.coerce.number(), z.coerce.string()],
          output: z.boolean(),
        }),
      ),
    ).toBe(true);
    expect(
      isSameType(
        z.function({
          input: [z.coerce.number(), z.coerce.string()],
          output: z.boolean(),
        }),
        z.function({ input: [z.number(), z.string()], output: z.boolean() }),
      ),
    ).toBe(true);
  });
});
