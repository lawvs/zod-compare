---
"zod-compare": minor
---

Update `isCompatibleType` to use the `(expectedType, providedType)` assignability model and improve TypeScript-like compatibility checks for optional and nullable wrappers, unions, finite literal and enum values, arrays, tuples, objects, records, maps, and sets.

Document that Zod 4 brands are type-only and compare like their underlying runtime schema.
