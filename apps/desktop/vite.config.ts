import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, "src/renderer"),
  base: "./",
  resolve: {
    alias: {
      "@codarch-city/city-model": path.resolve(
        rootDir,
        "../../packages/city-model/src/index.ts"
      )
    }
  },
  plugins: [react()],
  build: {
    outDir: path.join(rootDir, "dist/renderer"),
    emptyOutDir: true,
    target: "es2022"
  },
  server: {
    port: 5175,
    // Si 5175 está ocupado (sesión anterior), Vite elige el siguiente libre.
    strictPort: false
  }
});
