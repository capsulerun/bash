import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/commands/**/*.handler.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  clean: true,
  treeshake: true,
  skipNodeModulesBundle: true,
  tsconfig: 'tsconfig.build.json',
});
