# `Capsule` Bash MCP

An MCP server that gives your AI agent the ability to run bash commands in a secure, persistent, WebAssembly-sandboxed environment.

## How It Works

Each session runs inside a WebAssembly sandbox powered by [`@capsule-run/bash-wasm`](https://github.com/capsulerun/bash). The sandbox provides:

- **Persistent state**: cwd, env vars, and filesystem changes persist across commands within a session
- **Filesystem diff**: every `run` response includes a diff of what changed on disk
- **Isolated memory**: each session gets its own address space, no cross-session leakage
- **No host access**: the sandbox cannot reach your host filesystem or network

## Tools

| Tool       | Description                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `run`      | Run a bash command in a sandboxed session. Returns stdout, stderr, exit code, filesystem diff, and current shell state (cwd + env). |
| `reset`    | Reset the filesystem and shell state (cwd, env vars) for a session back to their initial values.                                    |
| `sessions` | List all active shell sessions.                                                                                                     |

### Sessions

Commands within the same `session_id` share cwd, environment variables, and filesystem state across calls. Each session maps to an isolated sandbox directory under `.capsule/sessions/<session_id>`.

### Example

Ask your AI agent:

> _"I have a log file — count how many errors occurred per hour."_

The agent calls `run` sequentially:

```json
{ "command": "mkdir -p /data && echo 'ERROR 10:01\nINFO 10:02\nERROR 10:45\nERROR 11:03' > /data/app.log", "session_id": "analysis" }
{ "command": "grep 'ERROR' /data/app.log | sed 's/ERROR \\([0-9]*\\):.*/\\1/' | sort | uniq -c", "session_id": "analysis" }
```

Each call returns `stdout`, `stderr`, `exitCode`, a filesystem `diff`, and the updated shell `state`.

## Setup

Add to your MCP client configuration (e.g. Claude Desktop, Cursor):

```json
{
  "mcpServers": {
    "bash": {
      "command": "npx",
      "args": ["-y", "@capsule-run/bash-mcp"]
    }
  }
}
```

## Limitations

- **Wasm bash** — runs a WASI-compiled bash; some advanced shell features or native binaries may not be available
