import path from 'path';
import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'mv',
  description: 'Move files and directories.',
  usage: 'mv [options] source... destination',
  options: {
    '-f': 'Move files or directories.',
  },
};

export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
  const source = opts.args[0];
  const destination = opts.args[1];

  if (!source || !destination) {
    return { stdout: '', stderr: `bash: mv: missing file operand`, exitCode: 1 };
  }

  const sourceFileName = path.basename(source);
  const sourceAbsolutePath = await runtime.resolvePath(state, source);
  const isSourceFolder = sourceAbsolutePath
    ? await runtime.executeCode(
        state,
        `require('fs').statSync('${sourceAbsolutePath}').isDirectory();`,
      )
    : false;

  const destinationAbsolutePath = await runtime.resolvePath(state, destination);
  const isDestinationFolder = destinationAbsolutePath
    ? await runtime.executeCode(
        state,
        `require('fs').statSync('${destinationAbsolutePath}').isDirectory();`,
      )
    : false;

  if (isSourceFolder && !isDestinationFolder) {
    return {
      stdout: '',
      stderr: `bash: mv: rename ${source} to ${destination}: Not a directory`,
      exitCode: 1,
    };
  }

  if (!sourceAbsolutePath) {
    return {
      stdout: '',
      stderr: `bash: mv: ${source}: No such file or directory`,
      exitCode: 1,
    };
  }

  if (isDestinationFolder) {
    await runtime.executeCode(
      state,
      `
            const fs = require('fs');
            (async () => {
                ${
                  isSourceFolder
                    ? `await fs.cp('${sourceAbsolutePath}', '${destinationAbsolutePath}', {recursive: true });`
                    : `await fs.cp('${sourceAbsolutePath}', '${path.join(destinationAbsolutePath as string, sourceFileName)}');`
                }
                fs.rmSync('${sourceAbsolutePath}', ${isSourceFolder ? '{ recursive: true }' : '{}'});
            })()
        `,
    );
    return { stdout: `${isSourceFolder ? 'Folder' : 'File'} moved ✔`, stderr: '', exitCode: 0 };
  }

  if (!isDestinationFolder && destinationAbsolutePath) {
    await runtime.executeCode(
      state,
      `const fs = require('fs');
            (async () => {
                await fs.rm('${destinationAbsolutePath}', { recursive: true });
                await fs.copyFile('${sourceAbsolutePath}', '${destinationAbsolutePath}');
                await fs.rm('${sourceAbsolutePath}');
            })()
        `,
    );
    return { stdout: 'File moved ✔', stderr: '', exitCode: 0 };
  }

  if (!isDestinationFolder && !destinationAbsolutePath) {
    await runtime.executeCode(
      state,
      `const fs = require('fs');
            fs.renameSync('${sourceAbsolutePath}', '${destination}');
        `,
    );
    return { stdout: `${isSourceFolder ? 'Folder' : 'File'} moved ✔`, stderr: '', exitCode: 0 };
  }

  return {
    stdout: '',
    stderr: `bash: mv: ${destination}: No such file or directory`,
    exitCode: 1,
  };
};
