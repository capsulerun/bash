# `Capsule` Bash

## Install

```bash
npm install @capsule-run/bash @capsule-run/bash-wasm
```

## Usage

```typescript
import { Bash } from '@capsule-run/bash';
import { WasmRuntime } from '@capsule-run/bash-wasm';

const bash = new Bash({ runtime: new WasmRuntime() });

const result = await bash.run('mkdir src && touch src/index.ts');

console.log(result);
/*
{
  stdout: "Folder created ✔\nFile created ✔",
  stderr: "",
  diff: { created: ['src', 'src/index.ts'], modified: [], deleted: [] },
  duration: 10,
  exitCode: 0,
}
*/
```

For full documentation, visit the [GitHub repository](https://github.com/capsulerun/bash).

## License

Apache License 2.0.
