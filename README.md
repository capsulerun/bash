<div align="center">

# ```Capsule``` Bash

**Sandboxed bash made for agents**

![CI](https://github.com/capsulerun/bash/actions/workflows/ci.yml/badge.svg)

![Example Shell](assets/example.gif)
</div>

## Quick Start

```bash
# Core engine
npm install @capsule-run/bash

# Wasm execution environment (the sandbox)
npm install @capsule-run/bash-wasm
```

### Via your backend
```typescript
import { Bash } from "@capsule-run/bash";
import { WasmRuntime } from "@capsule-run/bash-wasm";

const bash = new Bash({ runtime: new WasmRuntime()});

const result = await bash.run("mkdir src && touch src/index.ts");

console.log(result);
/*
{
  stdout: "Folder created ✔\nFile created ✔",
  stderr: "",
  diff: {created: ['src', 'src/index.ts'], modified: [], deleted: [] },
  duration: 10,
  exitCode: 0,
}
*/
```

#### Or Via MCP server

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

Read MCP readme to get more information [here](https://github.com/capsulerun/bash/packages/bash-mcp).

#### Or direct shell

```bash
pnpm -s bash-wasm-shell
```

> [!IMPORTANT]
> `pip` is required to compile the python sandbox. Both sandboxes js/python are needed to run the shell.

## How it works

Capsule Bash is built around three main concepts that make it essential for agents :

- **Commands & Sandboxes**

  Bash commands are reimplemented in JavaScript. Letting an agent freely use a bash environment, even a reimplemented one, could be risky for the host system. So each command needs to run in a sandbox.

  The sandbox part is modular. It allows you to plug in any sandboxed runtime into the main bash class.
  By default, Capsule provides a `WasmRuntime` that uses [Capsule](https://github.com/capsulerun/capsule) to execute commands inside WebAssembly sandboxes.

- **Instant feedback**

  Traditional bash is designed for humans. Apart from read‑only commands, silence is usually interpreted as success. But in an agentic environment, silence has no particular value.

  When an agent runs a mutating command, it has no direct way to know if it succeeded. It has to run a second command to check. For example, create a file, then list the directory to confirm it exists. This means every mutating command can cost two calls.

  `Capsule` Bash solves this by giving instant feedback. It returns all the important information for each command: exit code, stdout, stderr, and which files were changed.

- **Workspace**

  Capsule Bash uses a mounted workspace for the filesystem. You can see what the agent does in real time, but the agent only has access to the workspace folder. Your host system physically does not exist for the agent.

  By default, you can inspect the workspace folder in `.capsule/session/workspace`. This gives you more control over the agent's filesystem and keeps your host safe.



## Limitations

Bash-wasm(WasmRuntime) is not available for browser. It is meant to be used in a Node.js environment.

## Contributing

Contributions are welcome! You can contribute by improving the documentation, adding or improving commands, or reporting issues.

### For adding or improving commands

Commands live in `packages/bash/src/commands/`. To add a new command or update an existing one:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-command`
3. Add your command in `packages/bash/src/commands/` (or update existing ones)
4. Add a few unit tests
5. Open a Pull Request

That's it!

## License

This project is licensed under the Apache License 2.0, see the [LICENSE](LICENSE) file for details.

