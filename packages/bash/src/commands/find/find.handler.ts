import type { CommandContext, CommandHandler, CommandManual } from '@capsule-run/bash-types';

export const manual: CommandManual = {
  name: 'find',
  description: 'Search for files in a directory hierarchy.',
  usage: 'find [path] [-name pattern] [-type f|d]',
  options: {
    // just to not returns error
    '-n': '',
    '-a': '',
    '-m': '',
    '-e': '',
    '-t': '',
    '-y': '',
    '-p': '',
  },
};

function parseRawArgs(raw: string[]): {
  searchPath: string;
  name: string | null;
  type: 'f' | 'd' | null;
} {
  let searchPath = '.';
  let name: string | null = null;
  let type: 'f' | 'd' | null = null;

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '-name' && raw[i + 1]) {
      name = raw[++i];
    } else if (raw[i] === '-type' && raw[i + 1]) {
      const val = raw[++i];
      if (val === 'f' || val === 'd') type = val;
    } else if (!raw[i].startsWith('-')) {
      searchPath = raw[i];
    }
  }

  return { searchPath, name, type };
}

function matchesName(entryName: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regexStr}$`).test(entryName);
}

export const handler: CommandHandler = async ({ opts, state, runtime }: CommandContext) => {
  const { searchPath, name, type } = parseRawArgs(opts.raw);

  const absolutePath = await runtime.resolvePath(state, searchPath);
  if (!absolutePath) {
    return {
      stdout: '',
      stderr: `bash: find: '${searchPath}': No such file or directory`,
      exitCode: 1,
    };
  }

  const results: string[] = [];

  const walk = async (absPath: string, displayPath: string) => {
    const info = (await runtime.executeCode(
      state,
      `
            (function() {
                const fs = require('fs');
                const stat = fs.statSync('${absPath}');
                if (stat.isDirectory()) {
                    return { isDirectory: true, entries: fs.readdirSync('${absPath}') };
                }
                return { isDirectory: false };
            })()
        `,
    )) as { isDirectory: boolean; entries?: string[] };

    const entryName = displayPath.split('/').pop() ?? displayPath;
    const entryType = info.isDirectory ? 'd' : 'f';

    const typeMatch = type === null || type === entryType;
    const nameMatch = name === null || matchesName(entryName, name);

    if (typeMatch && nameMatch) {
      results.push(displayPath);
    }

    if (info.isDirectory) {
      await Promise.all(
        (info.entries ?? []).map((entry) => walk(`${absPath}/${entry}`, `${displayPath}/${entry}`)),
      );
    }
  };

  await walk(absolutePath, searchPath);

  return { stdout: results.join('\n'), stderr: '', exitCode: 0 };
};
