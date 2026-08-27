import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { zodToString } from "../utils.ts";

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
