---
"zod-compare": minor
---

Add comparison support for Zod 4.3 and 4.4 schema updates.

Zod 4.3 support covers schema variants including `z.xor()`, `z.looseRecord()`, and `.exactOptional()`. Zod 4.4 support treats empty `z.union([])` and `z.xor([])` schemas, including nested empty unions, as `never` for TypeScript-level same-type and compatibility checks. It also keeps `z.undefined()` object properties required and clarifies runtime-only comparison warnings while leaving strict runtime behavior to custom rules.
