import { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'mkdir',
  description: 'Make directories',
  usage: 'mkdir [options] directory...',
  options: {
    '-p': 'Create parent directories as needed',
  },
};

export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
  const stderr: string[] = [];
  let created = 0;

  await Promise.all(
    opts.args.map(async (arg) => {
      const segments = arg.split('/').filter((s) => s !== '');
      const isAbsolute = arg.startsWith('/');
      const parentSegments = segments.slice(0, -1);
      const parentFolder =
        parentSegments.length > 0 ? (isAbsolute ? '/' : '') + parentSegments.join('/') : '.';

      const parentFolderAbsolutePath = await runtime.resolvePath(state, parentFolder);

      const hasTraversal = segments.some((s) => s === '..');

      if (!parentFolderAbsolutePath && hasTraversal) {
        stderr.push(`bash: mkdir: '${arg}': Permission denied`);

        return;
      }

      if (!parentFolderAbsolutePath && !opts.hasFlag('p')) {
        stderr.push(`bash: mkdir: '${arg}': No such file or directory`);

        return;
      }

      const escaped = JSON.stringify(arg);

      if (opts.hasFlag('p')) {
        await runtime.executeCode(
          state,
          `require('fs').mkdirSync(${escaped}, { recursive: true });`,
        );
      } else {
        await runtime.executeCode(state, `require('fs').mkdirSync(${escaped});`);
      }
      created++;
    }),
  );

  return {
    stdout: created > 0 ? `Folder${created > 1 ? 's' : ''} created ✔` : '',
    stderr: stderr.join('\n'),
    exitCode: stderr.length > 0 ? 1 : 0,
  };
};
