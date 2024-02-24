import type { EnumLike, ZodType } from "zod";
import { z } from "zod";
import {
  type IsSameTypeOptions,
  DEFAULT_COMPARE_TYPE_OPTIONS,
  isPrimitiveType,
} from "./utils.ts";

/**
 * isSameType is a function that checks if two ZodTypes are the same.
 *
 * Caveats:
 * - The function does not validate specific criteria such as min or max values, length, email, etc.
 * - It excludes comparisons involving methods like .describe(), .catch(), .default(), .refine(), and .transform().
 * - When comparing definitions with .or and .and, they are assessed sequentially based on their order.
 *
 * @param a - The first ZodType to compare.
 * @param b - The second ZodType to compare.
 * @returns A boolean indicating whether the two types are the same.
 *
 * @throws Will throw an error if it encounters an unknown type.
 *
 * @example
 * ```ts
 * isSameType(z.string(), z.string()); // true
 * isSameType(z.string(), z.number()); // false
 * ```
 */
export const isSameType = (
  a: ZodType,
  b: ZodType,
  options?: Partial<IsSameTypeOptions>
): boolean => {
  const opts = { ...DEFAULT_COMPARE_TYPE_OPTIONS, ...options };
  const interceptorResult = opts.interceptor(a, b, opts);
  if (interceptorResult === true || interceptorResult === false) {
    return interceptorResult;
  }

  if (a === undefined || b === undefined) {
    throw new Error("Failed to compare type! " + a + " " + b);
  }

  if (a === b) {
    return true;
  }

  // compare constructor
  if (a.constructor !== b.constructor) {
    // https://stackoverflow.com/questions/24959862/how-to-tell-if-two-javascript-instances-are-of-the-same-class-type
    return false;
  }
  // See https://github.com/colinhacks/zod/blob/master/src/types.ts
  if (!("typeName" in a._def) || !("typeName" in b._def)) {
    throw new Error("Failed to compare type! " + a._def + " " + b._def);
  }
  if (a._def.typeName !== b._def.typeName) {
    return false;
  }

  // ZodBranded
  if (opts.ignoreBranded) {
    if (a instanceof z.ZodBranded) {
      a = a.unwrap();
    }
    if (b instanceof z.ZodBranded) {
      b = b.unwrap();
    }
    return isSameType(a, b, opts);
  } else {
    if (a instanceof z.ZodBranded || b instanceof z.ZodBranded) {
      // We can not distinguish different branded type
      // throw new Error("Can not distinguish different branded type!");
      return false;
    }
  }

  // ZodPromise ZodOptional ZodNullable ZodBranded
  if ("unwrap" in a && typeof a.unwrap === "function") {
    if (!("unwrap" in b && typeof b.unwrap === "function")) {
      return false;
    }
    return isSameType(a.unwrap(), b.unwrap(), opts);
  }

  if (!opts.ignoreOptional && a.isOptional() !== b.isOptional()) return false;
  if (!opts.ignoreNullable && a.isNullable() !== b.isNullable()) return false;

  if (isPrimitiveType(a)) {
    // Already assert a and b are the same constructor
    return true;
  }

  // ZodObject
  if (a instanceof z.ZodObject && b instanceof z.ZodObject) {
    const aShape = a.shape;
    const bShape = b.shape;
    if (Object.keys(aShape).length !== Object.keys(bShape).length) return false;
    for (const key in aShape) {
      if (!(key in bShape)) return false;
      if (!isSameType(aShape[key], bShape[key], opts)) return false;
    }
    return true;
  }

  // ZodArray
  if (a instanceof z.ZodArray && b instanceof z.ZodArray) {
    return isSameType(a.element, b.element, opts);
  }

  // ZodTuple
  if (a instanceof z.ZodTuple && b instanceof z.ZodTuple) {
    if (a.items.length !== b.items.length) return false;
    for (let i = 0; i < a.items.length; i++) {
      if (!isSameType(a.items[i], b.items[i], opts)) return false;
    }
    // Compare rest
    if (a._def.rest || b._def.rest) {
      // If one has rest, the other must have rest
      if (!a._def.rest || !b._def.rest) return false;
      return isSameType(a._def.rest, b._def.rest, opts);
    }
    return true;
  }

  // ZodLiteral
  if (a instanceof z.ZodLiteral && b instanceof z.ZodLiteral) {
    return a.value === b.value;
  }

  // ZodIntersection aka and
  if (a instanceof z.ZodIntersection && b instanceof z.ZodIntersection) {
    return (
      isSameType(a._def.left, b._def.left, opts) &&
      isSameType(a._def.right, b._def.right, opts)
    );
  }

  // ZodUnion aka or
  if (a instanceof z.ZodUnion && b instanceof z.ZodUnion) {
    if (a.options.length !== b.options.length) return false;
    for (let i = 0; i < a.options.length; i++) {
      if (!isSameType(a.options[i], b.options[i], opts)) return false;
    }
    return true;
  }

  // ZodReadonly
  if (a instanceof z.ZodReadonly && b instanceof z.ZodReadonly) {
    return isSameType(a._def.innerType, b._def.innerType, opts);
  }

  // ZodRecord / ZodMap
  if (
    (a instanceof z.ZodRecord && b instanceof z.ZodRecord) ||
    (a instanceof z.ZodMap && b instanceof z.ZodMap)
  ) {
    return (
      isSameType(a.keySchema, b.keySchema, opts) &&
      isSameType(a.valueSchema, b.valueSchema, opts)
    );
  }

  // ZodSet
  if (a instanceof z.ZodSet && b instanceof z.ZodSet) {
    return isSameType(a._def.valueType, b._def.valueType, opts);
  }

  // ZodFunction
  if (a instanceof z.ZodFunction && b instanceof z.ZodFunction) {
    return (
      isSameType(a.parameters(), b.parameters(), opts) &&
      isSameType(a.returnType(), b.returnType(), opts)
    );
  }

  // ZodEnum
  if (a instanceof z.ZodEnum && b instanceof z.ZodEnum) {
    const optionsA: [string, ...string[]] = a.options;
    const optionsB: [string, ...string[]] = b.options;
    if (optionsA.length !== optionsB.length) return false;
    for (let i = 0; i < optionsA.length; i++) {
      if (optionsA[i] !== optionsB[i]) return false;
    }
    return true;
  }

  // ZodNativeEnum
  if (a instanceof z.ZodNativeEnum && b instanceof z.ZodNativeEnum) {
    const enumA: EnumLike = a.enum;
    const enumB: EnumLike = b.enum;
    if (Object.keys(enumA).length !== Object.keys(enumB).length) return false;
    for (const key in enumA) {
      if (enumA[key] !== enumB[key]) return false;
    }
    return true;
  }

  // ZodLazy
  // ZodEffects
  // ZodDefault
  // ZodCatch
  // ZodPipeline
  // ZodTransformer
  // ZodError
  console.error('Failed to compare type! "' + a, b);
  throw new Error("Unknown type! " + a._def.typeName + " " + b._def.typeName);
};
