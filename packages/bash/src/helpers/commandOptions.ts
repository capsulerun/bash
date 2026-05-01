import type { CommandOptions } from '@capsule-run/bash-types';

export function parsedCommandOptions(raw: string[]): CommandOptions {
  const flags: Set<string> = new Set();
  const options: Map<string, string> = new Map();
  const args: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];

    if (arg.startsWith('--') && arg.includes('=')) {
      const [key, ...val] = arg.slice(2).split('=');

      options.set(key, val.join('='));
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);

      if (raw[i + 1] && !raw[i + 1].startsWith('-')) {
        options.set(key, raw[++i]);
      } else {
        flags.add(key);
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      for (const char of arg.slice(1)) {
        flags.add(char);
      }
    } else {
      args.push(arg);
    }
  }

  return {
    raw,
    flags,
    options,
    args,
    hasFlag: (...names: string[]) => names.some((name) => flags.has(name)),
  };
}
