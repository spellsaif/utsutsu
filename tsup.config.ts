import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false, // Leave unminified for easy debugging in consuming apps
  treeshake: true,
  external: ["react", "react-dom"],
});
