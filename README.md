# Zod Compare

[![Build](https://github.com/lawvs/zod-compare/actions/workflows/build.yml/badge.svg)](https://github.com/lawvs/zod-compare/actions/workflows/build.yml)
[![npm](https://img.shields.io/npm/v/zod-compare)](https://www.npmjs.com/package/zod-compare)

Compare two [Zod](https://zod.dev/) schemas recursively.

`zod-compare` provides functions to compare Zod schemas, allowing you to determine whether two schemas are the same or compatible.

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
  z.object({ name: z.string(), other: z.number() }),
  z.object({ name: z.string() }),
);
// true
```

## Advanced Usage

### Custom Rules

You can use `createIsSameTypeFn` to create a custom comparison function.

```ts
import {
  createIsSameTypeFn,
  isSameTypePresetRules,
  defineCompareRule,
} from "zod-compare";

const customRule = defineCompareRule(
  "custom rule",
  (a, b, next, recheck, context) => {
    if (a.description !== b.description) {
      return false;
    }
    return next();
  },
);

const customIsSameType = createIsSameTypeFn([
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

console.log(context.stacks);
```

## Caveats

The default rules `isSameTypePresetRules` will disregard any custom validations like `min`, `max`, `length`, among others. Additionally, these default rules cannot be utilized for comparing `ZodLazy`, `ZodEffects`, `ZodDefault`, `ZodCatch`, `ZodPipeline`, `ZodTransformer`, `ZodError` types.

If there is a necessity to compare these types, custom rules can be established using `defineCompareRule`.

## API

### `isSameType`

Compares two Zod schemas and returns `true` if they are the same.

```ts
const isSameType: (a: ZodType, b: ZodType, context?: CompareContext) => boolean;
```

### `createIsSameTypeFn`

Creates a custom comparison function.

```ts
const defineCompareRule: (
  name: string,
  rule: CompareFn,
) => {
  name: string;
  rule: CompareFn;
};

const createIsSameTypeFn: (rules: CompareRule[]) => typeof isSameType;
```

### `isCompatibleType` (Experimental API)

Compares two Zod schemas and returns `true` if they are compatible.

```ts
function isCompatibleType(a: ZodType, b: ZodType): boolean;
```

### Types

```ts
type CompareContext = {
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

type CompareRule = {
  name: string;
  compare: CompareFn;
};
```

## License

MIT
