# Zod Compare

[![Build](https://github.com/lawvs/zod-compare/actions/workflows/build.yml/badge.svg)](https://github.com/lawvs/zod-compare/actions/workflows/build.yml)

Compare two [Zod](https://zod.dev/) schemas recursively.

`zod-compare` provides functions to compare Zod schemas, allowing you to determine whether two schemas are the same or compatible.

## Installation

```bash
npm install zod zod-compare --save
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

`isSameType` also offers an `interceptor` option, enabling you to tailor the comparison process according to your needs.

```ts
isSameType(
  z.object({ name: z.string(), other: z.number() }),
  z.object({ name: z.string() }),
  {
    interceptor: (a, b) => {
      if (a instanceof z.ZodObject && b instanceof z.ZodObject) {
        // return boolean to override the comparison result
        return a.shape.name === b.shape.name;
      }
      // return other values to use the default comparison
    },
  },
);
// true
```

## Caveats

`zod-compare` is designed to compare Zod schemas created by the developer.
We do not have plans to support comparing schemas that include custom validation functions or other advanced Zod features.

This tool will disregard any custom validations like `min`, `max`, `length`, among others.

Furthermore, it cannot be utilized for comparing `ZodLazy`, `ZodEffects`, `ZodDefault`, `ZodCatch`, `ZodPipeline`, `ZodTransformer`, `ZodError` types.

But you can use the `interceptor` option to customize the comparison process.

## API

### `isSameType`

Compares two Zod schemas and returns `true` if they are the same.

```ts
function isSameType(
  a: ZodType,
  b: ZodType,
  options?: {
    interceptor?: (a: ZodType, b: ZodType) => boolean | undefined;
  },
): boolean;
```

### `isCompatibleType` (Unstable API)

```ts
function isCompatibleType(
  a: ZodType,
  b: ZodType,
  options?: {
    interceptor?: (a: ZodType, b: ZodType) => boolean | undefined;
  },
): boolean;
```

## License

MIT
