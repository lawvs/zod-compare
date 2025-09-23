import { describe, expect, test } from "vitest";
import z from "zod/v4";
import { isSameType } from "../is-same-type.ts";
import type { CompareContext } from "../types.ts";

describe("zod4 isSameType context", () => {
  test("should context work with different primitive type", () => {
    const context: CompareContext = {
      stacks: [],
    };
    const result = isSameType(z.number(), z.string(), context);

    expect(result).toBe(false);
    expect(context?.stacks?.length).toEqual(5);
    expect(context?.stacks?.at(0)?.name).toEqual("compare constructor");
  });

  test("should context work with different type", () => {
    const context: CompareContext = {
      stacks: [],
    };
    const result = isSameType(
      z.object({ name: z.number() }),
      z.object({ name: z.string() }),
      context,
    );

    expect(result).toBe(false);
    expect(context?.stacks?.length).toEqual(14);
    expect(context?.stacks?.at(0)?.name).toEqual("compare constructor");
  });

  test("should context result works", () => {
    const context: CompareContext = {
      stacks: [],
    };
    const result = isSameType(
      z.tuple([z.string()]),
      z.tuple([z.string()]).rest(z.unknown()),
      context,
    );

    expect(result).toBe(false);
    expect(context?.stacks?.length).toEqual(18);
    expect(
      context?.stacks?.map((i) => [
        i.name,
        [i.target[0]._zod.def.type, i.target[1]?._zod?.def?.type],
        i.result,
      ]),
    ).toMatchSnapshot();
  });
});
