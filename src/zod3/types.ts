import { type ZodType } from "zod/v3";

export type CompareContext = {
  stacks?: {
    name: string;
    target: [a: ZodType, b: ZodType];
    result: boolean;
  }[];
} & Record<string, unknown>;

export type CompareFn = (
  a: ZodType,
  b: ZodType,
  next: () => boolean,
  recheck: (a: ZodType, b: ZodType) => boolean,
  context: CompareContext,
) => boolean;

export type CompareRule = {
  name: string;
  compare: CompareFn;
};
