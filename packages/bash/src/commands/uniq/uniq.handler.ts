import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'uniq',
  description: 'Filter adjacent matching lines.',
  usage: 'uniq [options] [file]',
  options: {
    '-c': 'Prefix each output line with the count of consecutive occurrences',
    '-d': 'Only print lines that are repeated (duplicates)',
    '-u': 'Only print lines that are not repeated (unique)',
    '-i': 'Case-insensitive comparison',
  },
};

export const handler: CommandHandler = async ({ opts, state, runtime, stdin }: CommandContext) => {
  const stderr: string[] = [];

  const count = opts.hasFlag('c');
  const onlyDuplicates = opts.hasFlag('d');
  const onlyUnique = opts.hasFlag('u');
  const caseInsensitive = opts.hasFlag('i');

  let lines: string[];

  if (opts.args.length === 0) {
    if (!stdin) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }
    lines = stdin.split('\n');
  } else {
    const arg = opts.args[0];
    const abs = await runtime.resolvePath(state, arg);

    if (!abs) {
      return {
        stdout: '',
        stderr: `bash: uniq: ${arg}: No such file or directory`,
        exitCode: 1,
      };
    }

    const isDirectory = (await runtime.executeCode(
      state,
      `require('fs').statSync('${abs}').isDirectory();`,
    )) as boolean;

    if (isDirectory) {
      return {
        stdout: '',
        stderr: `bash: uniq: ${arg}: Is a directory`,
        exitCode: 1,
      };
    }

    const content = (await runtime.executeCode(
      state,
      `require('fs').readFileSync('${abs}', 'utf8');`,
    )) as string;

    lines = content.split('\n');
  }

  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  if (lines.length === 0) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  type Group = { line: string; count: number };
  const groups: Group[] = [];

  for (const line of lines) {
    const last = groups[groups.length - 1];
    const key = caseInsensitive ? line.toLowerCase() : line;
    const lastKey = last ? (caseInsensitive ? last.line.toLowerCase() : last.line) : null;

    if (last && key === lastKey) {
      last.count++;
    } else {
      groups.push({ line, count: 1 });
    }
  }

  const filtered = groups.filter((g) => {
    if (onlyDuplicates) return g.count > 1;
    if (onlyUnique) return g.count === 1;

    return true;
  });

  const output = filtered.map((g) => (count ? `${String(g.count).padStart(4)} ${g.line}` : g.line));

  return {
    stdout: output.join('\n'),
    stderr: stderr.join('\n'),
    exitCode: 0,
  };
};
