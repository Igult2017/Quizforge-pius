// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ES-module-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(), // standard React plugin
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"], // prevents multiple React versions
  },
  root: path.resolve(__dirname, "client"), // set root to client folder
  build: {
    outDir: path.resolve(__dirname, "dist/public"), // final output folder
    emptyOutDir: true,
    rollupOptions: {
      external: [], // DO NOT externalize react-router-dom
      // If needed, explicitly mark packages here that shouldn't be bundled
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"], // prevent access to hidden files
    },
  },
});

