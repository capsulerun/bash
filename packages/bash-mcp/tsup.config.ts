import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  treeshake: true,
  noExternal: [/.*/],
  tsconfig: 'tsconfig.json',
  onSuccess: async () => {
    const sandboxesDir = resolve(__dirname, '../bash-wasm/dist/sandboxes');
    const outDir = resolve(__dirname, 'dist/sandboxes');

    mkdirSync(outDir, { recursive: true });
    for (const file of readdirSync(sandboxesDir)) {
      if (file.endsWith('.wasm')) {
        copyFileSync(join(sandboxesDir, file), join(outDir, file));
      }
    }
    console.log('Copied .wasm files to dist/sandboxes/');
  },
});
