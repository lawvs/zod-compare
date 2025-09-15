import { beforeAll, describe, expect, test } from "vitest";
import { z } from "zod/v4";
import type { $ZodType } from "zod/v4/core";
import { z as zm } from "zod/v4/mini";
import { isZodType } from "../utils.ts";

describe("snapshot", () => {
  beforeAll(() => {
    const weakSet = new WeakSet();
    expect.addSnapshotSerializer({
      serialize(val: $ZodType, config, indentation, depth, refs, printer) {
        const normalizeZodVal = (val: $ZodType) => {
          return {
            ...("_zod" in val
              ? {
                  _zod: {
                    ...("def" in val._zod ? { def: val._zod["def"] } : {}),
                  },
                }
              : {}),
            ...("def" in val ? { def: val["def"] } : {}),
            "~standard": val["~standard"],
          };
        };
        const normalizedVal = normalizeZodVal(val);
        weakSet.add(normalizedVal);

        return printer(normalizedVal, config, indentation, depth, refs);
      },
      test(val) {
        if (weakSet.has(val)) {
          return false;
        }
        return isZodType(val);
        // return (
        //   val &&
        //   typeof val === "object" &&
        //   ("def" in val || "standard" in val || "_zod" in val)
        // );
      },
    });
  });

  test("should z.string() match snapshot", () => {
    expect(z.string()).toMatchSnapshot();
    expect(zm.string()).toMatchSnapshot();
  });

  test("should z.literal() match snapshot", () => {
    expect(z.literal("test")).toMatchSnapshot();
    expect(zm.literal("test")).toMatchSnapshot();
  });

  test("should z.object() match snapshot", () => {
    expect(
      z.object({ foo: z.string(), bar: z.number().nullable() }),
    ).toMatchSnapshot();
    expect(
      zm.object({ foo: zm.string(), bar: zm.nullable(zm.number()) }),
    ).toMatchSnapshot();
  });

  test("should z.array() match snapshot", () => {
    expect(z.array(z.string())).toMatchSnapshot();
    expect(zm.array(zm.string())).toMatchSnapshot();
  });

  test("should z.tuple() match snapshot", () => {
    expect(z.tuple([z.string(), z.number()], z.boolean())).toMatchSnapshot();
    expect(zm.tuple([zm.string(), zm.number()], z.boolean())).toMatchSnapshot();
  });

  test("should z.union() match snapshot", () => {
    expect(z.union([z.string(), z.number()])).toMatchSnapshot();
    expect(zm.union([zm.string(), zm.number()])).toMatchSnapshot();
  });

  test("should z.intersection() match snapshot", () => {
    expect(z.intersection(z.string(), z.number())).toMatchSnapshot();
    expect(zm.intersection(zm.string(), zm.number())).toMatchSnapshot();
  });

  test("should z.record() match snapshot", () => {
    expect(z.record(z.string(), z.number())).toMatchSnapshot();
    expect(zm.record(zm.string(), zm.number())).toMatchSnapshot();
  });

  test("should z.enum() match snapshot", () => {
    expect(z.enum(["foo", "bar", "baz"])).toMatchSnapshot();
    expect(zm.enum(["foo", "bar", "baz"])).toMatchSnapshot();
  });

  test("should z.function() match snapshot", () => {
    expect(
      z.function({
        input: [z.string()],
        output: z.number(),
      }),
    ).toMatchSnapshot();
    expect(
      zm.function({ input: [z.string()], output: z.number() }),
    ).toMatchSnapshot();
  });
});
