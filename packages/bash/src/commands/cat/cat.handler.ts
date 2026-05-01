import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'cat',
  description: 'Concatenate files and print on the standard output.',
  usage: 'cat [file]',
};

export const handler: CommandHandler = async ({ opts, stdin, state, runtime }: CommandContext) => {
  const stderr: string[] = [];
  const stdout: string[] = [];

  if (opts.args.length === 0) {
    return { stdout: stdin, stderr: '', exitCode: 0 };
  }

  await Promise.all(
    opts.args.map(async (arg) => {
      const destinationAbsolutePath = await runtime.resolvePath(state, arg);

      if (!destinationAbsolutePath) {
        stderr.push(`bash: cat: ${arg}: No such file or directory`);

        return;
      }

      const isDirectory = (await runtime.executeCode(
        state,
        `require('fs').statSync('${destinationAbsolutePath}').isDirectory();`,
      )) as boolean;

      if (isDirectory) {
        stderr.push(`bash: cat: ${arg}: Is a directory`);

        return;
      }

      const fileContent = (await runtime.executeCode(
        state,
        `require('fs').readFileSync('${destinationAbsolutePath}', 'utf8');`,
      )) as string;

      stdout.push(fileContent);
    }),
  );

  return {
    stdout: stdout.join('\n'),
    stderr: stderr.join('\n'),
    exitCode: stderr.length > 0 ? 1 : 0,
  };
};
