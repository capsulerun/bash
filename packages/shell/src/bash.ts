import { Bash } from '@capsule-run/bash';
import { WasmRuntime } from '@capsule-run/bash-wasm';

export const bash = new Bash({
    runtime: new WasmRuntime(),
});

await bash.preload();
