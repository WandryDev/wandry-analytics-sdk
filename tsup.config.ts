import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  dts: true,
  format: ["cjs", "esm"],
  clean: true,
  ...options,
}));
