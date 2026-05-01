import type { CommandManual } from '@capsule-run/bash-types';

export function displayCommandManual(command: CommandManual): string {
  const helpText =
    `NAME:\n${command.name}\n\nUSAGE:\n${command.usage}\n\nDESCRIPTION:\n${command.description}\n\nOPTIONS:\n` +
    Object.entries(command.options || {})
      .map(([flag, desc]) => `  ${flag.padEnd(5)} ${desc}`)
      .join('\n');

  return helpText + '\n';
}
