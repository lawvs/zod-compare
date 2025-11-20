import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "playground",
  base: "./",
  build: {
    outDir: "../dist-playground",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "playground/index.html"),
      },
    },
  },
});
