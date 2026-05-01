import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
import { parsedCommandOptions } from '../helpers/commandOptions';
import { displayCommandManual } from '../helpers/commandManual';

import type {
  BaseRuntime,
  CommandHandler,
  CommandManual,
  CommandResult,
  CustomCommand,
  State,
} from '@capsule-run/bash-types';
import { Parser } from './parser';
import type { ASTNode, CommandNode } from './parser';

type FsSnapshot = Record<string, number>;

export class Executor {
  constructor(
    private readonly runtime: BaseRuntime,
    private readonly customCommands: CustomCommand[],
    private readonly state: State,
  ) {}

  private async snapshotFs(root: string): Promise<FsSnapshot> {
    const sandboxRoot = root;
    const code = `
            const fs = require('fs');
            const path = require('path');
            const root = ${JSON.stringify(sandboxRoot)};
            const snapshot = {};
            const walk = (dir) => {
                try {
                    for (const entry of fs.readdirSync(dir)) {
                        const fullPath = path.join(dir, entry);
                        try {
                            const stat = fs.statSync(fullPath);
                            if (stat.isDirectory()) {
                                snapshot[fullPath.slice(root.length + 1) + '/'] = stat.mtimeMs;
                                walk(fullPath);
                            } else {
                                snapshot[fullPath.slice(root.length + 1)] = stat.mtimeMs;
                            }
                        } catch {}
                    }
                } catch {}
            };
            walk(root);
            return snapshot;
        `;

    try {
      return (await this.runtime.executeCode(this.state, code)) as FsSnapshot;
    } catch {
      return {};
    }
  }

  private diffSnapshots(
    before: FsSnapshot,
    after: FsSnapshot,
  ): { created: string[]; modified: string[]; deleted: string[] } {
    const created: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    for (const [path, size] of Object.entries(after)) {
      if (!(path in before)) created.push(path);
      else if (before[path] !== size) modified.push(path);
    }

    for (const path of Object.keys(before)) {
      if (!(path in after)) deleted.push(path);
    }

    return { created, modified, deleted };
  }

  async execute(node: ASTNode, stdin = ''): Promise<CommandResult> {
    try {
      switch (node.type) {
        case 'command':
          return this.executeCommand(node, stdin);
        case 'pipeline':
          return this.executePipeline(node);
        case 'and':
          return this.executeAnd(node);
        case 'or':
          return this.executeOr(node);
        case 'sequence':
          return this.executeSequence(node);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        stdout: '',
        stderr: message,
        exitCode: 1,
        state: { cwd: this.state.cwd, env: this.state.env, exitCode: 1 },
        diff: { created: [], modified: [], deleted: [] },
        durationMs: 0,
      };
    }
  }

  private async executeScript(filePath: string, scriptArgs: string[]): Promise<CommandResult> {
    const start = Date.now();
    const absolutePath = await this.runtime.resolvePath(this.state, filePath);
    if (!absolutePath) {
      return {
        stdout: '',
        stderr: `bash: ${filePath}: No such file or directory`,
        exitCode: 1,
        durationMs: Date.now() - start,
      };
    }

    let content: string;
    try {
      content = (await this.runtime.executeCode(
        this.state,
        `require('fs').readFileSync('${absolutePath}', 'utf8');`,
      )) as string;
    } catch {
      return {
        stdout: '',
        stderr: `bash: sh: ${filePath}: No such file or directory`,
        exitCode: 1,
        durationMs: Date.now() - start,
      };
    }

    const lines = content.split('\n').filter((line) => !line.startsWith('#!'));
    let script = lines.join('\n');

    scriptArgs.forEach((arg, i) => {
      script = script.replace(new RegExp(`\\$${i + 1}`, 'g'), arg);
    });

    script = script.replace(/\$\d+/g, '');

    const parser = new Parser();
    const stdout: string[] = [];
    const stderr: string[] = [];
    let exitCode = 0;

    for (const line of script.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      try {
        const ast = parser.parse(trimmed);
        const result = await this.execute(ast);
        if (result.stdout) stdout.push(result.stdout);
        if (result.stderr) stderr.push(result.stderr);
        exitCode = result.exitCode;
        if (exitCode !== 0) break;
      } catch {
        continue;
      }
    }

    return {
      stdout: stdout.join('\n'),
      stderr: stderr.join('\n'),
      exitCode,
      durationMs: Date.now() - start,
    };
  }

  private async executeCommand(node: CommandNode, stdin: string): Promise<CommandResult> {
    const [name, ...args] = node.args;
    let result: CommandResult;
    const start = Date.now();

    if (name === 'sh' || name === 'bash') {
      const [file, ...scriptArgs] = args;
      if (!file)
        return {
          stdout: '',
          stderr: `bash: ${name}: missing script operand`,
          exitCode: 1,
          durationMs: Date.now() - start,
        };
      return this.executeScript(file, scriptArgs);
    }

    for (const r of node.redirects) {
      if (r.op === '<<') {
        stdin = r.body;
        continue;
      }

      if (r.op === '<') {
        if (r.file === '/dev/null') {
          stdin = '';
          continue;
        }

        try {
          stdin = (await this.runtime.executeCode(
            this.state,
            `
                        const fs = require('fs');
                        const path = require('path');
                        return fs.readFileSync(path.resolve(${JSON.stringify(r.file)}), 'utf8');
                    `,
          )) as string;
        } catch {
          return {
            stdout: '',
            stderr: `bash: ${r.file}: No such file or directory`,
            exitCode: 1,
            durationMs: Date.now() - start,
          };
        }
      }
    }

    const opts = parsedCommandOptions(args);
    const command = await this.searchCommandHandler(name);

    const snapshotRoot = this.state.cwd || '/';
    const before = await this.snapshotFs(snapshotRoot);

    if (!command) {
      result = {
        stdout: '',
        stderr: `bash: ${name}: command not found`,
        exitCode: 127,
        durationMs: Date.now() - start,
      };
    } else if (opts.hasFlag('h', 'help') && command.manual) {
      result = {
        stdout: displayCommandManual(command.manual),
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - start,
      };
    } else {
      let invalidOption: string | undefined;

      if (command.manual) {
        for (const flag of opts.flags) {
          if (flag === 'h' || flag === 'help') continue;

          const isShort = flag.length === 1;
          const expectedName = isShort ? `-${flag}` : `--${flag}`;

          if (!command.manual.options || !command.manual.options.hasOwnProperty(expectedName)) {
            invalidOption = isShort ? flag : `--${flag}`;
            break;
          }
        }

        if (!invalidOption) {
          for (const key of opts.options.keys()) {
            const expectedName = `--${key}`;
            if (!command.manual.options || !command.manual.options.hasOwnProperty(expectedName)) {
              invalidOption = expectedName;
              break;
            }
          }
        }
      }

      if (invalidOption) {
        return {
          stdout: '',
          stderr: `bash: ${name}: invalid option -- ${invalidOption}\n\nusage: ${command.manual?.usage}`,
          exitCode: 1,
          durationMs: Date.now() - start,
        };
      }

      try {
        result = await command.handler({
          opts,
          stdin,
          state: this.state,
          runtime: this.runtime,
        });
      } catch (error) {
        result = {
          stdout: '',
          stderr: error as string,
          exitCode: 1,
          durationMs: Date.now() - start,
        };
      }
    }

    let currentStdout = result.stdout;
    let currentStderr = result.stderr;

    for (const r of node.redirects) {
      if (r.op === '>&') {
        if (r.from === 2 && r.to === 1) {
          currentStdout += currentStderr;
          currentStderr = '';
        } else if (r.from === 1 && r.to === 2) {
          currentStderr += currentStdout;
          currentStdout = '';
        }

        continue;
      }

      if (r.op === '>' || r.op === '>>') {
        if (r.file === '/dev/null') {
          currentStdout = '';
          continue;
        }

        if (r.file === '/dev/stdout') {
          continue;
        }

        if (r.file === '/dev/stderr') {
          currentStderr += currentStdout;
          currentStdout = '';
          continue;
        }

        try {
          await this.runtime.executeCode(
            this.state,
            `
                        const fs = require('fs');
                        const path = require('path');
                        const filePath = path.resolve(${JSON.stringify(r.file)});

                        fs.mkdirSync(path.dirname(filePath), { recursive: true });
                        fs.${r.op === '>>' ? 'appendFileSync' : 'writeFileSync'}(filePath, ${JSON.stringify(currentStdout)});
                        return filePath;
                    `,
          );

          currentStdout = 'File created ✔';
        } catch {
          return {
            stdout: '',
            stderr: `bash: ${r.file}: No such file or directory`,
            exitCode: 1,
            durationMs: Date.now() - start,
          };
        }
      }
    }

    const after = await this.snapshotFs(snapshotRoot);
    const diff = this.diffSnapshots(before, after);

    const durationMs = Date.now() - start;
    this.state.setLastExitCode(result.exitCode);

    result = {
      ...result,
      stdout: currentStdout,
      stderr: currentStderr,
      diff,
      state: { cwd: this.state.cwd, env: this.state.env, exitCode: result.exitCode },
      durationMs,
    };
    return result;
  }

  private async executePipeline(node: {
    type: 'pipeline';
    commands: CommandNode[];
  }): Promise<CommandResult> {
    let stdin = '';
    let result: CommandResult = { stdout: '', stderr: '', exitCode: 0, durationMs: 0 };
    let durationMs = 0;

    for (const cmd of node.commands) {
      result = await this.executeCommand(cmd, stdin);
      durationMs += result.durationMs || 0;
      stdin = result.stdout;
    }

    return { ...result, durationMs };
  }

  private async executeAnd(node: {
    type: 'and';
    left: ASTNode;
    right: ASTNode;
  }): Promise<CommandResult> {
    const left = await this.execute(node.left);

    if (left.exitCode !== 0) return left;

    const right = await this.execute(node.right);
    return {
      ...right,
      stdout: [left.stdout, right.stdout].filter(Boolean).join('\n'),
      diff: this.mergeDiffs(left.diff, right.diff),
      durationMs: (left.durationMs || 0) + (right.durationMs || 0),
    };
  }

  private async executeOr(node: {
    type: 'or';
    left: ASTNode;
    right: ASTNode;
  }): Promise<CommandResult> {
    const left = await this.execute(node.left);

    if (left.exitCode === 0) return left;

    const right = await this.execute(node.right);
    return {
      ...right,
      stdout: [left.stdout, right.stdout].filter(Boolean).join('\n'),
      diff: this.mergeDiffs(left.diff, right.diff),
      durationMs: (left.durationMs || 0) + (right.durationMs || 0),
    };
  }

  private async executeSequence(node: {
    type: 'sequence';
    left: ASTNode;
    right: ASTNode;
  }): Promise<CommandResult> {
    const left = await this.execute(node.left);
    const right = await this.execute(node.right);
    return {
      ...right,
      stdout: [left.stdout, right.stdout].filter(Boolean).join('\n'),
      diff: this.mergeDiffs(left.diff, right.diff),
      durationMs: (left.durationMs || 0) + (right.durationMs || 0),
    };
  }

  private async searchCommandHandler(
    name: string,
  ): Promise<{ handler: CommandHandler; manual?: CommandManual } | undefined> {
    const commandsDir = path.resolve(__dirname, '../commands');
    const handlerPath = path.join(commandsDir, name, `${name}.handler`);

    const customCommand = this.customCommands.find((cmd) => cmd.name === name);
    if (customCommand) {
      return { handler: customCommand.handler, manual: customCommand.manual };
    }

    try {
      const mod = require(handlerPath);
      return { handler: mod.handler as CommandHandler, manual: mod.manual as CommandManual };
    } catch {
      return undefined;
    }
  }

  private mergeDiffs(
    a?: { created: string[]; modified: string[]; deleted: string[] },
    b?: { created: string[]; modified: string[]; deleted: string[] },
  ) {
    return {
      created: [...(a?.created ?? []), ...(b?.created ?? [])],
      modified: [...(a?.modified ?? []), ...(b?.modified ?? [])],
      deleted: [...(a?.deleted ?? []), ...(b?.deleted ?? [])],
    };
  }
}
