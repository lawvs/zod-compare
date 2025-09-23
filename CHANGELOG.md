# zod-compare

## 2.0.0

### Major Changes

- [#84](https://github.com/lawvs/zod-compare/pull/84) [`3e0bbf0`](https://github.com/lawvs/zod-compare/commit/3e0bbf006d0c504c69988c89997d607cd5d4f80a) Thanks [@lawvs](https://github.com/lawvs)! - Add first-class compatibility with Zod v4.
  - New entry point: `zod-compare/zod4` exposes the same comparison APIs for Zod v4
  - Peer dependency widened to `zod: ^3.25.0 || ^4.0.0`
  - No breaking changes for Zod v3 users

  Notes:
  - Mixed-major comparisons are not supported at runtime. When Zod majors differ, both `isSameType` and `isCompatibleType` throw an error.

  Usage:

  ```ts
  // Zod v4
  import { z } from "zod/v4";
  import { isSameType, isCompatibleType } from "zod-compare/zod4";

  // Zod v3
  import { z as z3 } from "zod";
  import {
    isSameType as isSameV3,
    isCompatibleType as isCompatV3,
  } from "zod-compare/zod3";
  ```

## 1.1.0

### Minor Changes

- [`c3ff484`](https://github.com/lawvs/zod-compare/commit/c3ff484af88a8faa195e868982f402871ea342c7) Thanks [@lawvs](https://github.com/lawvs)! - Upgrade dependencies

## 1.0.0

### Major Changes

- [`a49c6a3`](https://github.com/lawvs/zod-compare/commit/a49c6a324d510eb3c020e18b7a77cea1cffce726) Thanks [@lawvs](https://github.com/lawvs)! - Release 1.0

## 0.3.1

### Patch Changes

- 95175c4: feat: add compare result to debug stack

## 0.3.0

### Minor Changes

- b40d479: refactor: redesign isCompatibleType with new rule style

  The function `createIsSameTypeFn` has been renamed to `createCompareFn`.

## 0.2.0

### Minor Changes

- ff25a46: refactor!: replace misc options with middleware

  BREAKING CHANGE: The `options` object has been removed and replaced with custom rules.

## 0.1.4

### Patch Changes

- f19f193: fix: correctly compare union types in isCompatibleType
- cd00e6b: fix: flatten union in isCompatibleType

## 0.1.3

### Patch Changes

- df211c2: feat: flat union type

## 0.1.2

### Patch Changes

- c713d92: fix: order of intersection comparison in `isSameType` function

## 0.1.1

### Patch Changes

- cffe9d6: First Version
