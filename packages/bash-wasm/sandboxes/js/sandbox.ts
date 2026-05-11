import { task } from '@capsule-run/sdk';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

import type { State } from '@capsule-run/bash-types';

function wasmRelative(cwd: string, filePath: string): string {
  return path.resolve(cwd, filePath).replace(/^\//, '');
}

function resolveNodeModule(fromPath: string, id: string): string | null {
  let dir = path.dirname('/' + fromPath);

  while (true) {
    const base = wasmRelative('/', path.join(dir, 'node_modules', id));
    const candidates = [base, base + '.js', base + '/index.js'];

    const pkgJson = base + '/package.json';

    if (fs.existsSync(pkgJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8') as string);
        const main = pkg.main || 'index.js';
        candidates.unshift(wasmRelative('/', path.join(dir, 'node_modules', id, main)));
      } catch {}
    }

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }

    const parent = path.dirname(dir);
    if (parent === dir) return null;

    dir = parent;
  }
}

const builtins: Record<string, unknown> = { fs, path, 'fs/promises': fsPromises };

const makeRequire = (fromPath: string) => (id: string) => {
  let depPath: string;

  if (!id.startsWith('.') && !id.startsWith('/')) {
    if (id in builtins) return builtins[id];

    const resolved = resolveNodeModule(fromPath, id);

    if (!resolved) throw new Error(`Cannot find module '${id}'`);

    depPath = resolved;
  } else {
    const base = wasmRelative('/', path.resolve('/' + path.dirname(fromPath), id));

    depPath = fs.existsSync(base)
      ? base
      : fs.existsSync(base + '.js')
        ? base + '.js'
        : base + '/index.js';
  }

  const src = fs.readFileSync(depPath, 'utf-8') as string;
  const m = { exports: {} as any };
  const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', src);

  fn(m, m.exports, makeRequire(depPath), depPath, path.dirname(depPath));

  return m.exports;
};

const executeFile = task(
  { name: 'executeFile', compute: 'MEDIUM', ram: '512MB', allowedHosts: ['*'] },
  async (state: State, filePath: string, args: string[]) => {
    const capturedOutput: string[] = [];
    const relPath = wasmRelative(state.cwd, filePath);

    process.chdir(state.cwd);

    Object.defineProperty(process, 'argv', {
      value: ['node', relPath, ...args],
      writable: true,
      configurable: true,
    });

    const capture = (...logArgs: any[]): void => {
      capturedOutput.push(logArgs.map((a) => String(a)).join(' '));
    };

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    console.log = capture;
    console.error = capture;
    console.warn = capture;

    try {
      const code = fs.readFileSync(relPath, 'utf-8') as string;
      const mod = { exports: {} as any };
      const customRequire = makeRequire(relPath);

      const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', code);
      fn(mod, mod.exports, customRequire, relPath, path.dirname(relPath));

      const output = capturedOutput.join('\n');

      if (output) return output;

      return Object.keys(mod.exports).length > 0 ? mod.exports : null;
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  },
);

const executeCode = task(
  { name: 'executeCode', compute: 'LOW', ram: '256MB', allowedHosts: ['*'] },
  async (state: State, code: string): Promise<unknown> => {
    process.chdir(state.cwd);
    const capturedOutput: string[] = [];

    const capture = (...args: any[]): void => {
      capturedOutput.push(args.map((arg) => String(arg)).join(' '));
    };

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    console.log = capture;
    console.error = capture;
    console.warn = capture;

    const require = makeRequire(wasmRelative(state.cwd, '.'));

    try {
      let result;
      try {
        const wrapper = new Function('require', 'console', `return eval(${JSON.stringify(code)})`);
        result = await wrapper(require, console);
      } catch (e) {
        if (e instanceof SyntaxError) {
          const fn = new Function('require', 'console', code);
          result = await fn(require, console);
        } else {
          throw e;
        }
      }

      const output = capturedOutput.join('\n');

      if (output) {
        return result != null ? output + '\n' + String(result) : output;
      }

      return result ?? null;
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  },
);

export const resolvePath = task(
  { name: 'resolvePath', compute: 'LOW', ram: '32MB' },
  async (state: State, targetPath: string) => {
    process.chdir(state.cwd);

    if (!fs.existsSync(targetPath) && targetPath !== state.cwd) {
      throw new Error(`Path ${targetPath} does not exist`);
    }

    return path.resolve(targetPath);
  },
);

export const main = task(
  { name: 'main', compute: 'HIGH' },
  async (action: string, state: string, ...args: string[]): Promise<unknown> => {
    let parsedArgs = args.filter((arg) => typeof arg !== 'object'); // remove the unused kwargs
    let response: {
      success: boolean;
      result: unknown;
      error: { error_type: string; message: string } | null;
    };

    let parsedState: State = JSON.parse(state);

    if (action === 'PRELOAD') {
      response = { success: true, result: 'Sandbox preloaded successfully', error: null };
    } else if (action === 'EXECUTE_CODE') {
      response = await executeCode(parsedState, parsedArgs[0]);
    } else if (action === 'EXECUTE_FILE') {
      response = await executeFile(parsedState, parsedArgs[0], parsedArgs.slice(1));
    } else if (action === 'RESOLVE_PATH') {
      response = await resolvePath(parsedState, parsedArgs[0]);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    if (!response.success && response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  },
);
