# `Capsule` Bash MCP

[![MCP Server](https://img.shields.io/github/actions/workflow/status/capsulerun/bash/release.yml?branch=main&label=MCP%20Server)](https://github.com/capsulerun/bash/actions/workflows/release.yml)

An MCP server that gives your AI agent the ability to run bash commands in a secure, persistent, sandboxed environment.

## How It Works

Each session runs inside a WebAssembly sandbox. The sandbox provides:

- **Persistent state**: cwd, env vars, and filesystem changes persist across commands within a session
- **Filesystem diff**: every `run` response includes a diff of what changed on disk
- **Isolated memory**: each session gets its own address space, no cross-session leakage
- **No host access**: the sandbox cannot reach your host filesystem or network

Learn more about [Capsule Bash](https://github.com/capsulerun/bash).

## Tools

| Tool       | Description                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `run`      | Run a bash command in a sandboxed session. Returns stdout, stderr, exit code, filesystem diff, and current state (cwd + env). |
| `reset`    | Reset the filesystem and state (cwd, env vars) for a session back to their initial values.                                    |
| `sessions` | List all active sessions.                                                                                                     |

### Sessions

Commands within the same `session_id` share cwd, environment variables, and filesystem state across calls. 

### Example

Ask your AI agent:

> _"Write a Python script that averages a list of numbers."_

The agent calls `run` sequentially:

```json
{ "command": "mkdir -p /data && cd /data", "session_id": "custom_session" }
{ "command": "echo 'nums = [x for x in [1, 2, 3, []] if isinstance(x, int)]\nprint(sum(nums) / len(nums))' > avg.py", "session_id": "custom_session" }
{ "command": "python3 avg.py", "session_id": "custom_session" }
```

Each call returns `stdout`, `stderr`, `exitCode`, a filesystem `diff`, and the updated `state` to enrich context and keep trace in conversation history.

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

- Not all bash commands and options are implemented. Feel free to [open an issue](https://github.com/capsulerun/bash/issues/new) if a command is missing or behaves unexpectedly.
