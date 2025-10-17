import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: "src/renderer",
  base: "./",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "src/renderer/index.html"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer"),
      "@/styles": resolve(__dirname, "src/renderer/styles"),
      "@/components": resolve(__dirname, "src/renderer/components"),
    },
  },
});
