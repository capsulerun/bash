import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  treeshake: true,
  noExternal: [/^(?!@capsule-run\/).*/],
  tsconfig: 'tsconfig.json',
});
