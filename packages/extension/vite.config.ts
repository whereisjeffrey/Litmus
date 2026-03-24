import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync } from "fs";

function copyManifestPlugin() {
  return {
    name: "copy-manifest",
    writeBundle() {
      copyFileSync(
        resolve(__dirname, "src/manifest.json"),
        resolve(__dirname, "dist/manifest.json")
      );
      // Create placeholder icons directory
      mkdirSync(resolve(__dirname, "dist/icons"), { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  resolve: {
    alias: {
      "@placeholder/shared": resolve(__dirname, "../shared/src"),
    },
  },
  root: resolve(__dirname, "src/sidepanel"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "src/sidepanel/index.html"),
        "service-worker": resolve(
          __dirname,
          "src/background/service-worker.ts"
        ),
        "content-script": resolve(__dirname, "src/content/content-script.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "service-worker") return "service-worker.js";
          if (chunkInfo.name === "content-script") return "content-script.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
