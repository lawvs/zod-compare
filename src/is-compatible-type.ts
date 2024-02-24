import { z, type ZodType } from "zod";
import { isSameType } from "./is-same-type.ts";
import {
  DEFAULT_COMPARE_TYPE_OPTIONS,
  type IsCompatibleTypeOptions,
} from "./utils.ts";

/**
 * Check if a the higherType matches the lowerType
 *
 * @param higherType The looser type
 * @param lowerType The stricter type
 *
 * @example
 * ```ts
 * isCompatibleType(z.string(), z.string()); // true
 *
 * isCompatibleType(
 *   z.object({ name: z.string(), other: z.number() }),
 *   z.object({ name: z.string() })
 * );
 * // true
 * ```
 */
export const isCompatibleType = (
  higherType: ZodType,
  lowerType: ZodType,
  options?: Partial<IsCompatibleTypeOptions>,
): boolean => {
  const opts: IsCompatibleTypeOptions = {
    ...DEFAULT_COMPARE_TYPE_OPTIONS,
    ...options,
  };
  const interceptorResult = opts.interceptor(higherType, lowerType, opts);
  if (interceptorResult === true || interceptorResult === false) {
    return interceptorResult;
  }
  if (isSameType(higherType, lowerType, opts)) {
    return true;
  }

  if (!("typeName" in higherType._def) || !("typeName" in lowerType._def)) {
    throw new Error(
      "Failed to compare type! " + higherType._def + " " + lowerType._def,
    );
  }

  if (
    lowerType instanceof z.ZodOptional ||
    lowerType instanceof z.ZodNullable
  ) {
    return isCompatibleType(higherType, lowerType.unwrap(), opts);
  }

  // ZodUnion aka or
  if (higherType instanceof z.ZodUnion && lowerType instanceof z.ZodUnion) {
    for (let i = 0; i < higherType.options.length; i++) {
      const match = lowerType.options.some((option: ZodType) =>
        isCompatibleType(option, lowerType.options[i], opts),
      );
      if (!match) return false;
    }
    return true;
  }
  if (higherType instanceof z.ZodUnion) {
    return higherType.options.every((option: ZodType) =>
      isCompatibleType(option, lowerType, opts),
    );
  }
  if (lowerType instanceof z.ZodUnion) {
    return lowerType.options.some((option: ZodType) =>
      isCompatibleType(higherType, option, opts),
    );
  }

  // compare constructor
  if (higherType.constructor !== lowerType.constructor) {
    return false;
  }

  // ZodObject
  if (higherType instanceof z.ZodObject && lowerType instanceof z.ZodObject) {
    const superTypeShape = higherType.shape;
    const subTypeShape = lowerType.shape;
    if (Object.keys(superTypeShape).length < Object.keys(subTypeShape).length)
      return false;
    for (const key in subTypeShape) {
      if (!(key in superTypeShape)) return false;
      if (!isCompatibleType(superTypeShape[key], subTypeShape[key], opts)) {
        return false;
      }
    }
    return true;
  }

  // ZodArray
  if (higherType instanceof z.ZodArray && lowerType instanceof z.ZodArray) {
    return isCompatibleType(higherType.element, lowerType.element, opts);
  }

  // ZodTuple
  if (higherType instanceof z.ZodTuple && lowerType instanceof z.ZodTuple) {
    if (higherType.items.length < lowerType.items.length) return false;
    for (let i = 0; i < lowerType.items.length; i++) {
      if (!isCompatibleType(higherType.items[i], lowerType.items[i], opts)) {
        return false;
      }
    }
    // Check rest
    if (lowerType._def.rest) {
      if (!higherType._def.rest) return false;
      return isCompatibleType(higherType._def.rest, lowerType._def.rest, opts);
    }
    return true;
  }

  throw new Error(
    "Failed to compare types!" +
      higherType._def.typeName +
      " " +
      lowerType._def.typeName,
  );
};
