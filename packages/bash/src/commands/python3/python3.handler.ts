import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'python3',
  description: 'Execute Python code or a script file.',
  usage: 'python3 [-c code] [script.py] [args...]',
  options: {
    '-c': 'Evaluate inline Python code',
  },
};

export const handler: CommandHandler = async ({ opts, state, runtime }: CommandContext) => {
  const inline = opts.hasFlag('c');

  if (inline) {
    const [code, ...rest] = opts.args;

    if (!code) {
      return {
        stdout: '',
        stderr: 'bash: python3: -c requires a code argument',
        exitCode: 1,
      };
    }

    if (rest.length > 0) {
      return {
        stdout: '',
        stderr: 'bash: python3: unexpected arguments after -c',
        exitCode: 1,
      };
    }

    try {
      const result = (await runtime.executeCode(state, code, 'python')) as string;

      return { stdout: result ? String(result) : '', stderr: '', exitCode: 0 };
    } catch (e) {
      return { stdout: '', stderr: `bash: python3: ${e}`, exitCode: 1 };
    }
  }

  const [file, ...scriptArgs] = opts.args;

  if (!file) {
    return { stdout: '', stderr: 'bash: python3: no script specified', exitCode: 1 };
  }

  const absolutePath = await runtime.resolvePath(state, file);

  if (!absolutePath) {
    return {
      stdout: '',
      stderr: `bash: python3: ${file}: No such file or directory`,
      exitCode: 1,
    };
  }

  try {
    const result = (await runtime.executeFile(state, absolutePath, scriptArgs, 'python')) as string;

    return { stdout: result ? String(result) : '', stderr: '', exitCode: 0 };
  } catch (e) {
    return { stdout: '', stderr: `bash: python3: ${e}`, exitCode: 1 };
  }
};
