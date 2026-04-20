<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark-mode.png" />
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-light-mode.png" />
  <img alt="Capsule Bash" src="assets/logo-light-mode.png" width="80" />
</picture>

# `Capsule` Bash

**Sandboxed bash made for agents**

![CI](https://img.shields.io/github/actions/workflow/status/capsulerun/bash/ci.yml?branch=main) ![Release](https://img.shields.io/github/v/release/capsulerun/bash)

[Getting Started](#getting-started) • [How It Works](#how-it-works) • [Contributing](#contributing)

![Example Shell](assets/example.gif)
</div>

## Getting Started

### TypeScript SDK

```bash
npm install @capsule-run/bash @capsule-run/bash-wasm
```

Run it:

```typescript
import { Bash } from "@capsule-run/bash";
import { WasmRuntime } from "@capsule-run/bash-wasm";

const bash = new Bash({ runtime: new WasmRuntime() });

const result = await bash.run("mkdir src && touch src/index.ts");

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

### MCP server

```json
{
  "mcpServers": {
    "capsule": {
      "command": "npx",
      "args": ["-y", "@capsule-run/bash-mcp"]
    }
  }
}
```

See the [MCP README](packages/bash-mcp) for configuration details.

### Interactive shell

Clone the repository, then run from the project root:

```bash
pnpm -s bash-wasm-shell
```

> [!IMPORTANT]
> Python and pip are required to compile the Python sandbox. Both sandboxes (JS and Python) are needed to run the shell.

## How It Works

Capsule Bash is built around three ideas:

### Commands and sandboxes

Bash commands are reimplemented in TypeScript and each one runs inside a sandbox, isolating the host system from anything the agent executes. The sandbox layer is modular. Plug in any runtime that implements the interface. The default `WasmRuntime` uses [Capsule](https://github.com/capsulerun/capsule) to run commands inside WebAssembly.

> [!NOTE]
> Not all bash commands are implemented yet. See packages/bash/src/commands/ for the current list.

### Instant feedback

Traditional bash treats silence as success. In an agentic context, that forces a second call just to confirm the first one worked. Capsule Bash returns structured output for every command. Exit code, stdout, stderr, and a diff of filesystem changes.

### Workspace isolation

The agent operates in a mounted workspace directory (`.capsule/session/workspace` by default). Your host filesystem does not exist from the agent's perspective. You get full visibility into what the agent does without exposing your system.

## Limitations

`WasmRuntime` runs in Node.js only. So, browser environments are not supported with the existing runtime yet.

## Contributing

Contributions are welcome, whether it's documentation, new commands, or bug reports.

### Adding or improving commands

Commands live in `packages/bash/src/commands/`. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-command`
3. Add or update your command in `packages/bash/src/commands/`
4. Add unit tests
5. Open a pull request

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.

