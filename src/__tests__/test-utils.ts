import { describe } from "vitest";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { isCompatibleZod3Type, isSameZod3Type } from "../zod3.ts";
import { isCompatibleZod4Type, isSameZod4Type } from "../zod4.ts";

/**
 * Configuration type for running tests with different Zod versions
 */
export type ZodTestConfig = {
  version: string;
  zod: any;
  isSameType: typeof isSameZod3Type | typeof isSameZod4Type;
  isCompatibleType: typeof isCompatibleZod3Type | typeof isCompatibleZod4Type;
}

/**
 * Configuration for Zod3 tests
 */
export const zod3Config: ZodTestConfig = {
  version: "zod3",
  zod: z3,
  isSameType: isSameZod3Type,
  isCompatibleType: isCompatibleZod3Type,
};

/**
 * Configuration for Zod4 tests
 */
export const zod4Config: ZodTestConfig = {
  version: "zod4",
  zod: z4,
  isSameType: isSameZod4Type,
  isCompatibleType: isCompatibleZod4Type,
};

/**
 * Run a test suite with both Zod3 and Zod4 configurations
 *
 * @param testName The name of the test suite
 * @param testFn The test function that takes a ZodTestConfig
 */
export const runWithBothZodVersions = (
  testName: string,
  testFn: (config: ZodTestConfig) => void
): void => {
  describe(`${testName} (zod3)`, () => {
    testFn(zod3Config);
  });

  describe(`${testName} (zod4)`, () => {
    testFn(zod4Config);
  });
};
