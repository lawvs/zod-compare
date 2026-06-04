# ⚖️ Zod Compare

[![Build](https://github.com/lawvs/zod-compare/actions/workflows/build.yml/badge.svg)](https://github.com/lawvs/zod-compare/actions/workflows/build.yml)
[![npm](https://img.shields.io/npm/v/zod-compare)](https://www.npmjs.com/package/zod-compare)

Compare two [Zod](https://zod.dev/) schemas recursively.

`zod-compare` provides functions to compare Zod schemas, allowing you to determine whether two schemas are the same or compatible. Supports Zod v4.

## Installation

```bash
# npm
npm install zod zod-compare

# yarn
yarn add zod zod-compare

# pnpm
pnpm add zod zod-compare
```

## Usage

```ts
import { z } from "zod";
import { isSameType, isCompatibleType } from "zod-compare";

isSameType(z.string(), z.string()); // true
isSameType(z.string(), z.number()); // false
isSameType(
  z.object({ name: z.string(), other: z.number() }),
  z.object({ name: z.string() }),
);
// false

isCompatibleType(
  z.object({ name: z.string() }),
  z.object({ name: z.string(), other: z.number() }),
);
// true
```

Use the top-level helpers to compare schemas:

- `isSameType(a, b)`: true only if the two schemas have the same shape and types (ignores refinements like min/max/length, transforms, etc.)
- `isCompatibleType(expectedType, providedType)`: true if every value described by `providedType` is assignable to `expectedType` (`providedType <= expectedType`)

## Advanced Usage

### Custom Rules

You can use `createCompareFn` to create a custom comparison function.

```ts
import { z } from "zod";
import {
  createCompareFn,
  isSameTypePresetRules,
  defineCompareRule,
} from "zod-compare";

const customRule = defineCompareRule(
  "compare description",
  (a, b, next, recheck, context) => {
    // In Zod 4, .describe() stores metadata via z.globalRegistry
    const metaA = z.globalRegistry.get(a);
    const metaB = z.globalRegistry.get(b);
    if (metaA?.description !== metaB?.description) {
      return false;
    }
    return next();
  },
);

const strictIsSameType = createCompareFn([
  customRule,
  ...isSameTypePresetRules,
]);
```

## Debugging

You can pass a `context` object to the comparison functions to get more information about the comparison process.

```ts
const context = {
  stacks: [],
};
isSameType(
  z.object({ name: z.string(), other: z.number() }),
  z.object({ name: z.string(), other: z.string() }),
  context,
);

// type stacks = { name: string; target: [a: ZodType, b: ZodType]; result: boolean; }[]
console.log(context.stacks);
```

## Caveats

The default rules `isSameTypePresetRules` will disregard any custom validations like `min`, `max`, `length`, among others. Additionally, these default rules cannot be utilized for comparing `ZodLazy`, `ZodEffects`, `ZodDefault`, `ZodCatch`, `ZodPipeline`, `ZodTransformer`, `ZodError` types.

If there is a necessity to compare these types, custom rules can be established using `defineCompareRule`.

## API

### `isSameType`

Compares two Zod schemas and returns `true` if they are the same.

```ts
import { isSameType } from "zod-compare";

type isSameType: (a: $ZodType, b: $ZodType, context?: CompareContext) => boolean;
```

### `createCompareFn`

Creates a custom comparison function.

```ts
import { createCompareFn, defineCompareRule } from "zod-compare";

type defineCompareRule = (name: string, compare: CompareFn) => CompareRule;

type createCompareFn = (rules: CompareRule[]) => typeof isSameType;

// Example
const isSameType = createCompareFn(isSameTypePresetRules);
const isCompatibleType = createCompareFn(isCompatibleTypePresetRules);
```

### `isCompatibleType` (Experimental API)

Compares two Zod schemas and returns `true` if they are compatible.

```ts
import { isCompatibleType } from "zod-compare";
// The `expectedType` should be the wider/supertype schema.
// The `providedType` should be the narrower/subtype schema.
// Returns true when providedType <= expectedType.
type isCompatibleType: (
  expectedType: $ZodType,
  providedType: $ZodType,
  context?: CompareContext,
) => boolean;
```

In subtype-order terminology, `expectedType` is the higher type and
`providedType` is the lower type. For example,
`z.object({ name, other }) <= z.object({ name })`, so the wider `{ name }`
schema can be used as the expected type.

### Preset Rules

You can use the preset rules `isSameTypePresetRules` and `isCompatibleTypePresetRules` to create custom comparison functions.

```ts
import { isSameTypePresetRules, isCompatibleTypePresetRules } from "zod-compare";

type isSameTypePresetRules: CompareRule[];
type isCompatibleTypePresetRules: CompareRule[];

// Example
const yourIsSameType = createCompareFn([customRule, ...isSameTypePresetRules]);
```

### Types

```ts
type CompareContext = {
  stacks?: {
    name: string;
    target: [a: $ZodTypes, b: $ZodTypes];
    result: boolean;
  }[];
} & Record<string, unknown>;

type CompareFn = (
  a: $ZodTypes,
  b: $ZodTypes,
  next: () => boolean,
  recheck: (a: $ZodType, b: $ZodType) => boolean,
  context: CompareContext,
) => boolean;

type CompareRule = {
  name: string;
  compare: CompareFn;
};
```

## License

MIT
