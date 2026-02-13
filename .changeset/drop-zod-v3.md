---
"zod-compare": major
---

Drop Zod v3 support. Zod v4 is now the sole supported version.

- Removed `zod-compare/zod3` and `zod-compare/zod4` sub-exports — use the main `zod-compare` entry point
- Peer dependency narrowed to `zod: ^4.0.0`
- Removed Zod version detection utilities (`isZod3Schema`, `isZod4Schema`, `haveSameZodMajor`)
