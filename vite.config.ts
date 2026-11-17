import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes the built site work from any folder, which GitHub Pages needs.
// The build goes to docs/ because GitHub Pages can publish that folder directly.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },
});
