import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts6 from "@typescript/typescript6";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Workaround for the TS 7 transition: unplugin-dts emits declarations through
// the TS6 compatibility API, but API Extractor's default compiler folder points
// at top-level typescript@7, which does not include the traditional lib.*.d.ts
// files it follows for global utility types such as Readonly and Record.
// Remove this once unplugin-dts/API Extractor can roll up declarations under
// TypeScript 7 without a TS6 stdlib override.
const typescript6CompilerFolder = dirname(
  dirname(ts6.getDefaultLibFilePath({})),
);

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["zod"],
    },
  },
  plugins: [
    dts({
      bundleTypes: {
        invokeOptions: {
          typescriptCompilerFolder: typescript6CompilerFolder,
        },
      },
      include: ["src/**/*.ts", "src/**/*.d.ts"],
      exclude: ["src/**/__tests__/*"],
    }),
  ],
});
