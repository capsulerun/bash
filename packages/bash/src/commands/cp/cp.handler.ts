import path from 'path';
import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'cp',
  description: 'Copy files and directories.',
  usage: 'cp [options] source... destination',
  options: {
    '-r': 'Copy directories recursively.',
  },
};

export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
  const source = opts.args[0];
  const destination = opts.args[1];

  if (!source || !destination) {
    return { stdout: '', stderr: `bash: cp: missing file operand`, exitCode: 1 };
  }

  const sourceFileName = source.split('/').pop() || source;
  const parts = destination.split('/');
  const parentDestinationFolder = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';

  const sourceAbsolutePath = await runtime.resolvePath(state, source);
  const parentDestinationAbsolutePath = await runtime.resolvePath(state, parentDestinationFolder);
  const destinationAbsolutePath = await runtime.resolvePath(state, destination);

  const isSourceFolder = sourceAbsolutePath
    ? ((await runtime.executeCode(
        state,
        `require('fs').statSync('${sourceAbsolutePath}').isDirectory();`,
      )) as boolean)
    : false;
  const isDestinationFolder = destinationAbsolutePath
    ? ((await runtime.executeCode(
        state,
        `require('fs').statSync('${destinationAbsolutePath}').isDirectory();`,
      )) as boolean)
    : false;

  if (!sourceAbsolutePath) {
    return {
      stdout: '',
      stderr: `bash: cp: ${source}: No such file or directory`,
      exitCode: 1,
    };
  }

  if (isDestinationFolder && !isSourceFolder) {
    const destinationPath = path.join(destinationAbsolutePath as string, sourceFileName);

    await runtime.executeCode(
      state,
      `require('fs').copyFileSync('${sourceAbsolutePath}', '${destinationPath}');`,
    );

    return { stdout: 'File copied ✔', stderr: '', exitCode: 0 };
  }

  if (!destinationAbsolutePath && parentDestinationAbsolutePath && !isSourceFolder) {
    const destinationFileName = destination.split('/').pop() as string;
    const destinationPath = path.join(parentDestinationAbsolutePath, destinationFileName);

    await runtime.executeCode(
      state,
      `require('fs').copyFileSync('${sourceAbsolutePath}', '${destinationPath}');`,
    );
    return { stdout: 'File copied ✔', stderr: '', exitCode: 0 };
  }

  if (opts.hasFlag('r') && isSourceFolder) {
    await runtime.executeCode(
      state,
      `(async () => await require('fs').cp('${sourceAbsolutePath}', '${destinationAbsolutePath || destination}', { recursive: true }))()`,
    );
    return { stdout: 'Folder copied ✔', stderr: '', exitCode: 0 };
  }

  return {
    stdout: '',
    stderr: `bash: cp: ${destination}: No such file or directory`,
    exitCode: 1,
  };
};
