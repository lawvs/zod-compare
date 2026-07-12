# TypeScript 7 Declaration Rollup Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep TypeScript 7 in the project while preserving the existing public declaration API that uses `Readonly` and `Record<string, unknown>`.

**Architecture:** Restore the public source signatures exactly, then configure `unplugin-dts` to pass API Extractor a TypeScript 6 standard-library folder resolved through `@typescript/typescript6`. TypeScript 7 remains the project compiler; the override only supplies standard library declarations for declaration rollup analysis.

**Tech Stack:** Vite, unplugin-dts, API Extractor, TypeScript 7, `@typescript/typescript6`, pnpm.

## Global Constraints

- Do not change public TypeScript signatures to accommodate declaration tooling.
- Do not hard-code pnpm store paths or rely on the private `@typescript/old` dependency name.
- Do not disable declaration bundling or change the published package layout.
- Do not expand the existing `unplugin-dts` patch unless the supported invoke option cannot solve the problem.

---

### Task 1: Restore Public Types And Reproduce Rollup Failure

**Files:**

- Modify: `src/zod4/create-compare-fn.ts`
- Modify: `src/zod4/types.ts`

**Interfaces:**

- Consumes: existing `LegacyZodFunction`, `$ZodType`, `$ZodTypes`, and `CompareContext`.
- Produces: `createCompareFn(rules: CompareRule[])` whose returned comparator accepts `Readonly<$ZodType | LegacyZodFunction>` operands, and `CompareContext` as an object shape intersected with `Record<string, unknown>`.

- [x] **Step 1: Restore comparator operand types**

Change `src/zod4/create-compare-fn.ts` to keep the existing function body but restore the operand declarations:

```ts
  const isSameTypeFn = (
    left: Readonly<$ZodType | LegacyZodFunction>,
    right: Readonly<$ZodType | LegacyZodFunction>,
    context: CompareContext = {},
  ): boolean => {
```

- [x] **Step 2: Restore `CompareContext` utility type**

Change `src/zod4/types.ts` to keep the existing fields but restore the public type composition:

```ts
export type CompareContext = {
  stacks?: {
    name: string;
    target: [a: $ZodTypes, b: $ZodTypes];
    result: boolean;
  }[];
} & Record<string, unknown>;
```

- [x] **Step 3: Run declaration build to verify RED**

Run: `env -u FORCE_COLOR pnpm run build`

Expected: failure from API Extractor during declaration rollup with an `Unable to follow symbol` diagnostic for a restored global utility type such as `Readonly` or `Record`.

### Task 2: Point API Extractor At TypeScript 6 Stdlib

**Files:**

- Modify: `vite.config.ts`

**Interfaces:**

- Consumes: `@typescript/typescript6.getDefaultLibFilePath({})`.
- Produces: `typescriptCompilerFolder` set to the actual TypeScript 6 package root derived from the returned default lib path.

- [x] **Step 1: Confirm TypeScript 6 default lib resolution**

Run:

```bash
node --input-type=module -e 'import ts6 from "@typescript/typescript6"; console.log(ts6.version); console.log(ts6.getDefaultLibFilePath({}))'
```

Expected: prints a TypeScript 6 version and a path ending in `lib/lib.d.ts`.

- [x] **Step 2: Add the API Extractor stdlib override**

Change `vite.config.ts` imports and dts options:

```ts
import { dirname, resolve } from "node:path";
import ts6 from "@typescript/typescript6";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

const typescript6CompilerFolder = dirname(
  dirname(ts6.getDefaultLibFilePath({})),
);
```

```ts
    dts({
      bundleTypes: {
        invokeOptions: {
          typescriptCompilerFolder: typescript6CompilerFolder,
        },
      },
      include: ["src/**/*.ts", "src/**/*.d.ts"],
      exclude: ["src/**/__tests__/*"],
    }),
```

- [x] **Step 3: Run declaration build to verify GREEN**

Run: `env -u FORCE_COLOR pnpm run build`

Expected: build completes successfully and declaration rollup emits `dist/index.d.ts`.

- [x] **Step 4: Verify public declaration shape**

Run: `rg -n "Readonly|Record<string, unknown>" dist/index.d.ts`

Expected: output includes the restored comparator operands and `CompareContext` declaration using `Record<string, unknown>`.

### Task 3: Full Verification, Commit, Push, And PR Update

**Files:**

- Modify: `docs/superpowers/plans/2026-07-12-typescript-7-declaration-rollup-fix.md`
- Verify generated output only; do not commit `dist/` unless it is already tracked and changed.

**Interfaces:**

- Consumes: passing Task 2 build and restored declaration output.
- Produces: pushed branch update and PR description that no longer describes the public API workaround as the final approach.

- [x] **Step 1: Run full verification**

Run:

```bash
env -u FORCE_COLOR pnpm install --frozen-lockfile --reporter=silent
env -u FORCE_COLOR pnpm exec tsc --version
env -u FORCE_COLOR pnpm run typeCheck
env -u FORCE_COLOR pnpm exec vitest --run
env -u FORCE_COLOR pnpm run build
env -u FORCE_COLOR pnpm run build:playground
env -u FORCE_COLOR pnpm run format
```

Expected:

```text
TypeScript 7.0.2
typeCheck passes
64 tests pass
build passes
build:playground passes
format passes
```

- [x] **Step 2: Review diff**

Run: `git diff -- src/zod4/create-compare-fn.ts src/zod4/types.ts vite.config.ts docs/superpowers`

Expected: only the public signature restoration, `vite.config.ts` API Extractor override, and plan/spec docs are changed.

- [x] **Step 3: Commit**

Run:

```bash
git add src/zod4/create-compare-fn.ts src/zod4/types.ts vite.config.ts docs/superpowers
git commit -m "fix: preserve public types under TypeScript 7"
```

Expected: commit succeeds.

- [ ] **Step 4: Push branch**

Run: `git push origin chore/upgrade-typescript-7`

Expected: branch pushes successfully.

- [ ] **Step 5: Update PR body**

Run: `gh pr edit 119 --body-file <updated-body-file>`

Expected: PR body explains that API Extractor is pointed at the TypeScript 6 stdlib folder, includes references already gathered, and removes the previous public API workaround note.
