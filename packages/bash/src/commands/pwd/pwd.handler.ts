import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'pwd',
  description: 'Print name of current/working directory.',
  usage: 'pwd',
};

export const handler: CommandHandler = async ({ state, opts }: CommandContext) => {
  if (opts.args.length > 0) {
    return { stdout: '', stderr: `bash: pwd: too many arguments`, exitCode: 1 };
  }

  return { stdout: state.cwd, stderr: '', exitCode: 0 };
};
