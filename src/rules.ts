import { z, type ZodType } from "zod";
import { flatUnwrapUnion, isPrimitiveType } from "./utils.ts";

export type CompareContext = {
  stacks?: {
    name: string;
    target: [a: ZodType, b: ZodType];
  }[];
} & Record<string, unknown>;

type CompareFn = (
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

export const defineCompareRule = (name: string, rule: CompareFn) => ({
  name,
  rule,
});

export const isSameTypePresetRules = [
  {
    name: "undefined check",
    compare: (a, b, next) => {
      if (a === undefined || b === undefined) {
        throw new Error("Failed to compare type! " + a + " " + b);
      }
      return next();
    },
  },
  {
    name: "compare reference",
    compare: (a, b, next) => {
      if (a === b) {
        return true;
      }
      return next();
    },
  },
  {
    name: "compare constructor",
    compare: (a, b, next) => {
      // https://stackoverflow.com/questions/24959862/how-to-tell-if-two-javascript-instances-are-of-the-same-class-type
      if (a.constructor !== b.constructor) {
        return false;
      }
      return next();
    },
  },
  {
    name: "compare typeName",
    compare: (a, b, next) => {
      if (!("typeName" in a._def) || !("typeName" in b._def)) {
        throw new Error("Failed to compare type! " + a._def + " " + b._def);
      }
      if (a._def.typeName !== b._def.typeName) {
        return false;
      }
      return next();
    },
  },
  {
    name: "compare ZodBranded",
    compare: (a, b, next) => {
      if (a instanceof z.ZodBranded || b instanceof z.ZodBranded) {
        // We can not distinguish different branded type
        // throw new Error("Can not distinguish different branded type!");
        return false;
      }
      return next();
    },
  },
  {
    name: "unwrap ZodType",
    // ZodPromise ZodOptional ZodNullable ZodBranded
    compare: (a, b, next, recheck) => {
      if ("unwrap" in a && typeof a.unwrap === "function") {
        if (!("unwrap" in b && typeof b.unwrap === "function")) {
          return false;
        }
        return recheck(a.unwrap(), b.unwrap());
      }
      return next();
    },
  },
  {
    name: "is same primitive",
    compare: (a, b, next) => {
      if (
        isPrimitiveType(a) &&
        isPrimitiveType(b) &&
        a.constructor === b.constructor
      ) {
        return true;
      }
      return next();
    },
  },
  {
    name: "compare ZodObject",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodObject && b instanceof z.ZodObject) {
        const aShape = a.shape;
        const bShape = b.shape;
        if (Object.keys(aShape).length !== Object.keys(bShape).length)
          return false;
        for (const key in aShape) {
          if (!(key in bShape)) return false;
          if (!recheck(aShape[key], bShape[key])) return false;
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare ZodArray",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodArray && b instanceof z.ZodArray) {
        return recheck(a.element, b.element);
      }
      return next();
    },
  },
  {
    name: "compare ZodTuple",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodTuple && b instanceof z.ZodTuple) {
        if (a.items.length !== b.items.length) return false;
        for (let i = 0; i < a.items.length; i++) {
          if (!recheck(a.items[i], b.items[i])) return false;
        }
        // Compare rest
        if (a._def.rest || b._def.rest) {
          // If one has rest, the other must have rest
          if (!a._def.rest || !b._def.rest) return false;
          return recheck(a._def.rest, b._def.rest);
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare ZodLiteral",
    compare: (a, b, next) => {
      if (a instanceof z.ZodLiteral && b instanceof z.ZodLiteral) {
        return a.value === b.value;
      }
      return next();
    },
  },
  {
    name: "compare ZodIntersection",
    compare: (a, b, next, recheck) => {
      // ZodIntersection aka and
      if (a instanceof z.ZodIntersection && b instanceof z.ZodIntersection) {
        return (
          (recheck(a._def.left, b._def.left) &&
            recheck(a._def.right, b._def.right)) ||
          (recheck(a._def.left, b._def.right) &&
            recheck(a._def.right, b._def.left))
        );
      }
      return next();
    },
  },
  {
    name: "compare ZodUnion",
    compare: (a, b, next, recheck) => {
      // ZodUnion aka or
      if (a instanceof z.ZodUnion && b instanceof z.ZodUnion) {
        const aOptions = flatUnwrapUnion(a as z.ZodUnion<z.ZodUnionOptions>);
        const bOptions = flatUnwrapUnion(b as z.ZodUnion<z.ZodUnionOptions>);
        if (aOptions.length !== bOptions.length) return false;
        for (let optionA of aOptions) {
          let matchIndex = bOptions.findIndex((optionB) =>
            recheck(optionA, optionB),
          );
          if (matchIndex === -1) return false;
          bOptions.splice(matchIndex, 1);
        }
        return bOptions.length === 0;
      }
      return next();
    },
  },
  {
    name: "compare ZodReadonly",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodReadonly && b instanceof z.ZodReadonly) {
        return recheck(a._def.innerType, b._def.innerType);
      }
      return next();
    },
  },
  {
    name: "compare ZodRecord",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodRecord && b instanceof z.ZodRecord) {
        return (
          recheck(a.keySchema, b.keySchema) &&
          recheck(a.valueSchema, b.valueSchema)
        );
      }
      return next();
    },
  },
  {
    name: "compare ZodMap",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodMap && b instanceof z.ZodMap) {
        return (
          recheck(a.keySchema, b.keySchema) &&
          recheck(a.valueSchema, b.valueSchema)
        );
      }
      return next();
    },
  },
  {
    name: "compare ZodSet",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodSet && b instanceof z.ZodSet) {
        return recheck(a._def.valueType, b._def.valueType);
      }
      return next();
    },
  },
  {
    name: "compare ZodFunction",
    compare: (a, b, next, recheck) => {
      if (a instanceof z.ZodFunction && b instanceof z.ZodFunction) {
        return (
          recheck(a.parameters(), b.parameters()) &&
          recheck(a.returnType(), b.returnType())
        );
      }
      return next();
    },
  },
  {
    name: "compare ZodEnum",
    compare: (a, b, next) => {
      if (a instanceof z.ZodEnum && b instanceof z.ZodEnum) {
        const optionsA: [string, ...string[]] = a.options;
        const optionsB: [string, ...string[]] = b.options;
        if (optionsA.length !== optionsB.length) return false;
        for (let i = 0; i < optionsA.length; i++) {
          if (optionsA[i] !== optionsB[i]) return false;
        }
        return true;
      }
      return next();
    },
  },
  {
    name: "compare ZodNativeEnum",
    compare: (a, b, next) => {
      if (a instanceof z.ZodNativeEnum && b instanceof z.ZodNativeEnum) {
        const enumA: z.EnumLike = a.enum;
        const enumB: z.EnumLike = b.enum;
        if (Object.keys(enumA).length !== Object.keys(enumB).length)
          return false;
        for (const key in enumA) {
          if (enumA[key] !== enumB[key]) return false;
        }
        return true;
      }
      return next();
    },
  },
] as const satisfies CompareRule[];

export const strictIsSameTypeRules = [
  {
    name: "compare optional",
    compare: (a, b, next) => {
      if (a.isOptional() !== b.isOptional()) return false;
      return next();
    },
  },
  {
    name: "compare nullable",
    compare: (a, b, next) => {
      if (a.isNullable() !== b.isNullable()) return false;
      return next();
    },
  },
  {
    name: "compare corece",
    compare: (a, b, next) => {
      if ("corece" in a._def && "corece" in b._def) {
        if (a._def.corece !== b._def.corece) {
          return false;
        }
      }
      if ("corece" in a._def) {
        return false;
      }
      if ("corece" in b._def) {
        return false;
      }
      return next();
    },
  },
  {
    name: "compare description",
    compare: (a, b, next) => {
      if (a.description !== b.description) {
        return false;
      }
      return next();
    },
  },
] as const satisfies CompareRule[];
