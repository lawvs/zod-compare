import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["zod"],
    },
  },
  plugins: [
    dts({
      // TODO fix it https://github.com/qmhc/vite-plugin-dts/issues/399
      // rollupTypes: true,
      include: ["src/**/*.ts", "src/**/*.d.ts"],
      exclude: ["src/**/__tests__/*"],
    }),
  ],
});
