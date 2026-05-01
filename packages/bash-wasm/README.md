# `Capsule` Bash WASM Runtime

**WebAssembly runtime for `@capsule-run/bash`**

## Install

```bash
npm install @capsule-run/bash @capsule-run/bash-wasm
```

## Usage

```typescript
import { Bash } from '@capsule-run/bash';
import { WasmRuntime } from '@capsule-run/bash-wasm';

const bash = new Bash({ runtime: new WasmRuntime() });
```

> `WasmRuntime` runs in Node.js only. Browser environments are not supported.

For full documentation, visit the [GitHub repository](https://github.com/capsulerun/bash).

## License

Apache License 2.0.
