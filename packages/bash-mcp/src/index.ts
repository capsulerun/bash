import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Bash } from '@capsule-run/bash';
import { WasmRuntime } from '@capsule-run/bash-wasm';

const sessions = new Map<string, Bash>();

function getSession(sessionId: string): Bash {
  if (!sessions.has(sessionId)) {
    sessions.set(
      sessionId,
      new Bash({
        runtime: new WasmRuntime(),
        hostWorkspace: `.capsule/sessions/${sessionId}`,
      }),
    );
  }

  return sessions.get(sessionId)!;
}

const server = new McpServer(
  {
    name: '@capsule-run/bash-mcp',
    version: '0.1.9',
  },
  {
    instructions: `
    You are operating inside a sandboxed Bash environment (WebAssembly).
    To discover available commands, run: cat /workspace/manual.md
    Sessions are isolated: each session_id has its own cwd, env vars, and filesystem state.
    Use the same session_id across calls to maintain state within a workflow, or use an existing session_id to resume.
  `,
  },
);

server.registerTool(
  'run',
  {
    description: 'Execute a Bash command in the sandboxed environment',
    inputSchema: {
      command: z.string().describe('The bash command to execute.'),
      session_id: z
        .string()
        .optional()
        .default('default')
        .describe(
          "Identifier for the shell session. Commands within the same session share cwd, env, and filesystem state. Defaults to 'default'.",
        ),
    },
  },
  async ({ command, session_id }) => {
    const bash = getSession(session_id ?? 'default');
    const result = await bash.run(command);

    const text = JSON.stringify(
      {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        diff: result.diff ?? null,
        state: result.state ?? null,
      },
      null,
      2,
    );

    return {
      content: [{ type: 'text', text }],
      isError: result.exitCode !== 0,
    };
  },
);

server.registerTool(
  'reset',
  {
    description:
      "Reset a session's filesystem and shell state (cwd, env vars) to their initial values. Useful to start fresh without creating a new session.",
    inputSchema: {
      session_id: z
        .string()
        .optional()
        .default('default')
        .describe("The session to reset. Defaults to 'default'."),
    },
  },
  async ({ session_id }) => {
    const bash = getSession(session_id ?? 'default');

    bash.reset();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: true, session_id: session_id ?? 'default' }),
        },
      ],
    };
  },
);

server.registerTool(
  'sessions',
  {
    description: 'List all active session IDs and their current state.',
  },
  async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ sessions: Array.from(sessions.keys()) }),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();

await server.connect(transport);
