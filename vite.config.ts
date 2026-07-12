import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts6 from "@typescript/typescript6";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
