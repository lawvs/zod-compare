# TypeScript 7 declaration rollup compatibility

## Goal

Upgrade the project compiler to TypeScript 7 while preserving the existing public declaration API, including the `Readonly` comparator parameters and the `Record<string, unknown>` portion of `CompareContext`.

## Root cause

`unplugin-dts` uses the TypeScript 6 JavaScript Compiler API fallback to emit declarations, then invokes API Extractor to roll them into `dist/index.d.ts`. Its default API Extractor invocation resolves `typescriptCompilerFolder` from the top-level `typescript` package. Under TypeScript 7 that package no longer contains the traditional `lib.*.d.ts` files, so API Extractor cannot follow global utility types declared in `lib.es5.d.ts`, such as `Readonly` and `Record`.

The public-type edits in the current branch only avoid the first missing global symbols and are not an acceptable final fix.

## Design

1. Restore the two public source declarations to their pre-upgrade forms.
2. Resolve the TypeScript 6 standard library location dynamically through the API re-exported by `@typescript/typescript6`, using its `getDefaultLibFilePath()` result rather than a package-manager-specific path.
3. Pass the corresponding TypeScript 6 package root through `bundleTypes.invokeOptions.typescriptCompilerFolder` in the `unplugin-dts` Vite configuration.
4. Keep TypeScript 7 as the compiler used by the project's `typeCheck` command. The override applies only to API Extractor's declaration analysis.

## Constraints

- Do not change public TypeScript signatures to accommodate declaration tooling.
- Do not hard-code pnpm store paths or rely on the private `@typescript/old` dependency name.
- Do not disable declaration bundling or change the published package layout.
- Do not expand the existing `unplugin-dts` patch unless the supported invoke option cannot solve the problem.

## Verification

- Demonstrate that the restored signatures reproduce the declaration build failure before the configuration fix.
- Verify that the same build succeeds after only correcting `typescriptCompilerFolder`.
- Confirm `dist/index.d.ts` contains the original `Readonly` and `Record<string, unknown>` signatures.
- Run dependency installation, TypeScript 7 version check, type checking, tests, library build, playground build, and formatting.
