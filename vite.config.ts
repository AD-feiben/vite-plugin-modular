import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: {
        plugin: "./src/plugin.ts",
        cli: "./src/cli/index.ts",
        config: "./src/config.ts",
      },
      name: "VitePluginModular",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["vite", "inquirer", "table", "commander", "fs", "path"],
      output: [
        {
          format: "es",
          globals: {
            vite: "vite",
            inquirer: "inquirer",
            table: "table",
            commander: "commander",
            fs: "fs",
            path: "path",
          },
          assetFileNames: "assets/[name][extname]",
          chunkFileNames: "[name].js",
          entryFileNames: "[name].js",
        },
        {
          format: "cjs",
          globals: {
            vite: "vite",
            inquirer: "inquirer",
            table: "table",
            commander: "commander",
            fs: "fs",
            path: "path",
          },
          assetFileNames: "assets/[name][extname]",
          chunkFileNames: "[name].cjs",
          entryFileNames: "[name].cjs",
        },
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
