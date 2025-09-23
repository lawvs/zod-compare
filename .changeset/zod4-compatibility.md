---
"zod-compare": major
---

Add first-class compatibility with Zod v4.

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
