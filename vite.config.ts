import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      bundleTypes: true,
      include: ["src/**/*.ts", "src/**/*.d.ts"],
      exclude: ["src/**/__tests__/*"],
    }),
  ],
});
