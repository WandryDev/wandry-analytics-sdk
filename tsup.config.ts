import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  ...options,
}));
