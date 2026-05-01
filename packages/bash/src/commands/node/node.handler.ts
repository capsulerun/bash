import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'node',
  description: 'Execute JavaScript code or a script file.',
  usage: 'node [-e code] [script.js] [args...]',
  options: {
    '-e': 'Evaluate inline JavaScript code',
  },
};

export const handler: CommandHandler = async ({ opts, state, runtime }: CommandContext) => {
  const inline = opts.hasFlag('e');

  if (inline) {
    const [code, ...rest] = opts.args;

    if (!code) {
      return { stdout: '', stderr: 'bash: node: -e requires a code argument', exitCode: 1 };
    }

    if (rest.length > 0) {
      return { stdout: '', stderr: 'bash: node: unexpected arguments after -e', exitCode: 1 };
    }

    try {
      const result = (await runtime.executeCode(state, code)) as string;
      return { stdout: result ? String(result) : '', stderr: '', exitCode: 0 };
    } catch (e) {
      return { stdout: '', stderr: `bash: node: ${e}`, exitCode: 1 };
    }
  }

  const [file, ...scriptArgs] = opts.args;

  if (!file) {
    return { stdout: '', stderr: 'bash: node: no script specified', exitCode: 1 };
  }

  const absolutePath = await runtime.resolvePath(state, file);
  if (!absolutePath) {
    return {
      stdout: '',
      stderr: `bash: node: ${file}: No such file or directory`,
      exitCode: 1,
    };
  }

  try {
    const result = (await runtime.executeFile(state, absolutePath, scriptArgs)) as string;
    return { stdout: result ? String(result) : '', stderr: '', exitCode: 0 };
  } catch (e) {
    return { stdout: '', stderr: `bash: node: ${e}`, exitCode: 1 };
  }
};
