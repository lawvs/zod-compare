import type { $ZodType, $ZodTypes } from "zod/v4/core";

export type CompareContext = {
  stacks?: {
    name: string;
    target: [a: $ZodTypes, b: $ZodTypes];
    result: boolean;
  }[];
} & Record<string, unknown>;

export type CompareFn = (
  a: $ZodTypes,
  b: $ZodTypes,
  next: () => boolean,
  recheck: (a: $ZodType, b: $ZodType) => boolean,
  context: CompareContext,
) => boolean;

export type CompareRule = {
  name: string;
  compare: CompareFn;
};
