import { Bash } from '@capsule-run/bash';
import { WasmRuntime } from '@capsule-run/bash-wasm';

export const bash = new Bash({
  runtime: new WasmRuntime(),
});

export const preloadPromises = {
  js: bash.preload('js').catch(() => {}),
  python: bash.preload('python').catch(() => {}),
};
