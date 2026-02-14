import { describe, expect, test } from "vitest";
import z from "zod/v4";
import { createCompareFn } from "../create-compare-fn.ts";
import { isSameTypePresetRules } from "../is-same-type.ts";
import { defineCompareRule } from "../rules.ts";
import type { CompareRule } from "../types.ts";

describe("createCompareFn with custom rules", () => {
  test("should create a comparator with preset rules", () => {
    const customIsSameType = createCompareFn(isSameTypePresetRules);
    expect(customIsSameType(z.string(), z.string())).toBe(true);
    expect(customIsSameType(z.string(), z.number())).toBe(false);
  });

  test("should prepend a custom rule before preset rules", () => {
    // In Zod 4, .describe() stores metadata via z.globalRegistry
    const compareDescription = defineCompareRule(
      "compare description",
      (a, b, next) => {
        const metaA = z.globalRegistry.get(a);
        const metaB = z.globalRegistry.get(b);
        if (metaA?.description !== metaB?.description) {
          return false;
        }
        return next();
      },
    );

    const strictIsSameType = createCompareFn([
      compareDescription,
      ...isSameTypePresetRules,
    ]);

    // Same type, same description → true
    expect(
      strictIsSameType(
        z.string().describe("name"),
        z.string().describe("name"),
      ),
    ).toBe(true);

    // Same type, different description → false (custom rule rejects)
    expect(
      strictIsSameType(
        z.string().describe("name"),
        z.string().describe("age"),
      ),
    ).toBe(false);

    // Same type, no description → true (both undefined)
    expect(strictIsSameType(z.string(), z.string())).toBe(true);
  });

  test("should use defineCompareRule to create a rule matching CompareRule type", () => {
    const rule = defineCompareRule("test rule", (_a, _b, next) => next());
    expect(rule).toHaveProperty("name", "test rule");
    expect(rule).toHaveProperty("compare");
    expect(rule).not.toHaveProperty("rule");
  });

  test("should support a rule that uses recheck for recursive comparison", () => {
    // A custom rule that treats optional as different from non-optional
    // by comparing unwrapped inner types via recheck
    const compareOptionalStrict: CompareRule = {
      name: "strict optional check",
      compare: (a, b, next, recheck) => {
        const aType = a._zod.def.type;
        const bType = b._zod.def.type;
        if (aType === "optional" && bType === "optional") {
          // Both optional — recursively compare inner types
          return recheck(a._zod.def.innerType, b._zod.def.innerType);
        }
        if (aType === "optional" || bType === "optional") {
          // One optional, one not — not the same
          return false;
        }
        return next();
      },
    };

    const strictCompare = createCompareFn([
      compareOptionalStrict,
      ...isSameTypePresetRules,
    ]);

    // Both optional with same inner type → true
    expect(
      strictCompare(z.string().optional(), z.string().optional()),
    ).toBe(true);

    // One optional, one not → false (custom rule rejects)
    expect(strictCompare(z.string().optional(), z.string())).toBe(false);

    // Both optional but different inner → false
    expect(
      strictCompare(z.string().optional(), z.number().optional()),
    ).toBe(false);
  });

  test("should support a rule that short-circuits with context", () => {
    const alwaysTrue = defineCompareRule(
      "always true",
      (_a, _b, _next, _recheck, _context) => {
        return true;
      },
    );

    const alwaysSame = createCompareFn([alwaysTrue]);

    // Different types but custom rule always returns true
    expect(alwaysSame(z.string(), z.number())).toBe(true);
  });

  test("should pass context through to custom rules", () => {
    const visited: string[] = [];

    const trackingRule = defineCompareRule(
      "tracking rule",
      (a, _b, next, _recheck, _context) => {
        visited.push(a._zod.def.type);
        return next();
      },
    );

    const trackedCompare = createCompareFn([
      trackingRule,
      ...isSameTypePresetRules,
    ]);

    trackedCompare(z.string(), z.string());
    expect(visited).toContain("string");
  });

  test("should support replacing preset rules entirely", () => {
    const onlyStrings: CompareRule = {
      name: "only compare strings",
      compare: (a, b, _next) => {
        if (
          a._zod.def.type === "string" &&
          b._zod.def.type === "string"
        ) {
          return true;
        }
        return false;
      },
    };

    const stringOnlyCompare = createCompareFn([onlyStrings]);

    expect(stringOnlyCompare(z.string(), z.string())).toBe(true);
    expect(stringOnlyCompare(z.number(), z.number())).toBe(false);
  });
});
