import { defineConfig, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, cpSync } from "fs";

const sharedAlias = {
  "@placeholder/shared": resolve(__dirname, "../shared/src"),
};

function copyExtensionAssetsPlugin() {
  return {
    name: "copy-extension-assets",
    writeBundle() {
      copyFileSync(
        resolve(__dirname, "src/manifest.json"),
        resolve(__dirname, "dist/manifest.json")
      );
      cpSync(
        resolve(__dirname, "public/icons"),
        resolve(__dirname, "dist/icons"),
        { recursive: true }
      );
    },
  };
}

/**
 * After the main build (side panel), build content-script and service-worker
 * as IIFE bundles so Chrome can load them (no ES module imports).
 */
function buildScriptsPlugin() {
  return {
    name: "build-extension-scripts",
    async closeBundle() {
      // Build content script as IIFE
      await viteBuild({
        configFile: false,
        resolve: { alias: sharedAlias },
        build: {
          outDir: resolve(__dirname, "dist"),
          emptyOutDir: false,
          lib: {
            entry: resolve(__dirname, "src/content/content-script.ts"),
            name: "contentScript",
            formats: ["iife"],
            fileName: () => "content-script.js",
          },
          rollupOptions: {
            output: { extend: true },
          },
          minify: true,
          sourcemap: false,
        },
        logLevel: "warn",
      });

      // Build service worker as IIFE
      await viteBuild({
        configFile: false,
        resolve: { alias: sharedAlias },
        build: {
          outDir: resolve(__dirname, "dist"),
          emptyOutDir: false,
          lib: {
            entry: resolve(__dirname, "src/background/service-worker.ts"),
            name: "serviceWorker",
            formats: ["iife"],
            fileName: () => "service-worker.js",
          },
          rollupOptions: {
            output: { extend: true },
          },
          minify: true,
          sourcemap: false,
        },
        logLevel: "warn",
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssetsPlugin(), buildScriptsPlugin()],
  resolve: {
    alias: sharedAlias,
  },
  root: resolve(__dirname, "src/sidepanel"),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "src/sidepanel/index.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
