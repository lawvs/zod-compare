---
"zod-compare": major
---

Drop Zod v3 support. Zod v4 is now the sole supported version.

### Breaking Changes

- **Peer dependency**: Changed from `zod: ^3.25.0 || ^4.0.0` to `zod: ^4.0.0`. Zod v3 is no longer supported.
- **Removed sub-exports**: `zod-compare/zod3` and `zod-compare/zod4` entry points have been removed. Use the main `zod-compare` entry point instead.
- **Removed version utilities**: `isZod3Schema`, `isZod4Schema`, and `haveSameZodMajor` are no longer exported.
- **Simplified API surface**: `isSameType` and `isCompatibleType` now only accept Zod v4 schemas. Mixed-version comparison (which previously threw) is no longer possible.

### Migration

```diff
- import { isSameType } from "zod-compare/zod4";
+ import { isSameType } from "zod-compare";
```
