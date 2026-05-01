import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'grep',
  description: 'Display lines that match a pattern.',
  usage: 'grep [options] pattern [file...]',
  options: {
    '-i': 'Ignore case',
    '-v': 'Invert match',
    '-n': 'Display line number',
    '-r': 'Recursive',
  },
};

async function grepLines(
  content: string,
  pattern: string,
  flags: { ignoreCase: boolean; invert: boolean; lineNumber: boolean },
  prefix: string,
): Promise<string[]> {
  const results: string[] = [];
  const regexFlags = flags.ignoreCase ? 'i' : '';
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, regexFlags);
  } catch {
    return [];
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matched = regex.test(line);
    if (matched !== flags.invert) {
      const linePrefix = flags.lineNumber ? `${i + 1}:` : '';
      results.push(`${prefix}${linePrefix}${line}`);
    }
  }
  return results;
}

export const handler: CommandHandler = async ({ opts, state, runtime, stdin }: CommandContext) => {
  const ignoreCase = opts.hasFlag('i');
  const invert = opts.hasFlag('v');
  const lineNumber = opts.hasFlag('n');
  const recursive = opts.hasFlag('r');
  const grepFlags = { ignoreCase, invert, lineNumber };

  const [pattern, ...fileArgs] = opts.args;

  if (!pattern) {
    return { stdout: '', stderr: 'bash: grep: missing pattern', exitCode: 1 };
  }

  const stdout: string[] = [];
  const stderr: string[] = [];

  if (fileArgs.length === 0 && !recursive) {
    if (!stdin) {
      return { stdout: '', stderr: 'bash: grep: no input', exitCode: 1 };
    }
    const lines = await grepLines(stdin, pattern, grepFlags, '');
    stdout.push(...lines);
    return { stdout: stdout.join('\n'), stderr: '', exitCode: stdout.length > 0 ? 0 : 1 };
  }

  const targets = fileArgs.length > 0 ? fileArgs : ['.'];
  const multipleFiles = targets.length > 1 || recursive;

  const processPath = async (target: string) => {
    const absolutePath = await runtime.resolvePath(state, target);

    if (!absolutePath) {
      stderr.push(`bash: grep: ${target}: No such file or directory`);
      return;
    }

    const info = (await runtime.executeCode(
      state,
      `
            (function() {
                const fs = require('fs');
                const stat = fs.statSync('${absolutePath}');
                if (stat.isDirectory()) {
                    return { isDirectory: true, entries: fs.readdirSync('${absolutePath}') };
                }
                return { isDirectory: false, content: fs.readFileSync('${absolutePath}', 'utf8') };
            })()
        `,
    )) as { isDirectory: boolean; entries?: string[]; content?: string };

    if (info.isDirectory && !recursive) {
      stderr.push(`bash: grep: ${target}: Is a directory`);
      return;
    }

    if (info.isDirectory && recursive) {
      await Promise.all((info.entries ?? []).map((entry) => processPath(`${target}/${entry}`)));
      return;
    }

    const prefix = multipleFiles ? `${target}:` : '';
    const lines = await grepLines(info.content ?? '', pattern, grepFlags, prefix);
    stdout.push(...lines);
  };

  await Promise.all(targets.map((target) => processPath(target)));

  return {
    stdout: stdout.join('\n'),
    stderr: stderr.join('\n'),
    exitCode: stderr.length > 0 ? 1 : stdout.length > 0 ? 0 : 1,
  };
};
