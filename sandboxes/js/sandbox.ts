import { task } from "@capsule-run/sdk";
import path from "path";
import fs from "fs";

import type { State } from "@capsule-run/bash-types";

function wasmRelative(cwd: string, filePath: string): string {
  return path.resolve(cwd, filePath).replace(/^\//, '');
}

const executeFile = task(
  { name: "executeFile", compute: "MEDIUM", ram: "512MB" },
  async (state: State, filePath: string, args: string[]) => {
    const capturedOutput: string[] = [];
    const relPath = wasmRelative(state.cwd, filePath);

    Object.defineProperty(process, 'argv', {
      value: ['node', relPath, ...args],
      writable: true,
      configurable: true,
    });

    const originalLog = console.log;
    console.log = (...logArgs: any[]) => {
      capturedOutput.push(logArgs.map(a => String(a)).join(' '));
    };

    try {
      const code = fs.readFileSync(relPath, 'utf-8') as string;
      const mod = { exports: {} as any };

      const makeRequire = (fromPath: string) => (id: string) => {
        const base = wasmRelative('/', path.resolve('/' + path.dirname(fromPath), id));
        const depPath = fs.existsSync(base) ? base
          : fs.existsSync(base + '.js') ? base + '.js'
          : base + '/index.js';
        const src = fs.readFileSync(depPath, 'utf-8') as string;
        const m = { exports: {} as any };
        const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', src);
        fn(m, m.exports, makeRequire(depPath), depPath, path.dirname(depPath));
        return m.exports;
      };
      const customRequire = makeRequire(relPath);

      const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', code);
      fn(mod, mod.exports, customRequire, relPath, path.dirname(relPath));

      const output = capturedOutput.join('\n');
      if (output) {
        return Object.keys(mod.exports).length > 0
          ? output + '\n' + JSON.stringify(mod.exports)
          : output;
      }
      return mod.exports;
    } finally {
      console.log = originalLog;
    }
  }
);


const executeCode = task(
  { name: "executeCode", compute: "LOW", ram: "256MB" },
  async (state: State, code: string): Promise<unknown> => {
    process.chdir(state.cwd);
    const capturedOutput: string[] = [];
    const originalLog = console.log;

    console.log = (...args: any[]) => {
      capturedOutput.push(args.map(arg => String(arg)).join(' '));
    };

    try {
      let result;
      try {
        result = eval(code);
      } catch (e) {
        if (e instanceof SyntaxError && e.message.includes("return")) {
          const fn = new Function(code);
          result = fn();
        } else {
          throw e;
        }
      }

      const output = capturedOutput.join('\n');

      if (output) {
        return output + '\n' + result;
      }

      return result;
    } finally {
      console.log = originalLog;
    }
  }
);

const executeCommand = task(
  { name: "executeCommand", compute: "LOW", ram: "64MB" },
  async (state: State, scriptContent: string, args: string[]) => {
    process.chdir(state.cwd);
    const exports: { execute?: (args: string[]) => any } = {};

    console.log(args)
    const moduleWrapper = new Function('exports', scriptContent);

    moduleWrapper(exports);

    if (!exports.execute) {
      throw new Error("Script must export an 'execute' function");
    }

    return await exports.execute(args);
  }
)

export const resolveDirectoryPath = task(
  { name: "resolveDirectoryPath", compute: "LOW", ram: "32MB" },
  async (state: State, targetPath: string) => {
    process.chdir(state.cwd);

    if (!fs.existsSync(targetPath)) {
      throw new Error(`Directory path ${targetPath} does not exist`);
    }

    return '/' + path.resolve(targetPath);
  }
)

export const main = task(
  { name: "main", compute: "HIGH" },
  async (action: string, state: string, ...args: string[]): Promise<unknown> => {
    let parsedArgs = args.filter(arg => typeof arg !== "object"); // remove the unused kwargs
    let response: { success: boolean; result: unknown; error: { error_type: string; message: string } | null };

    let parsedState: State = JSON.parse(state);

    if (action === "LOAD") {
      response = { success: true, result: "Sandbox loaded successfully", error: null };
    } else if (action === "EXECUTE_COMMAND") {
      response = await executeCommand(parsedState, parsedArgs[0], parsedArgs.slice(1));
    } else if (action === "EXECUTE_CODE") {
      response = await executeCode(parsedState, parsedArgs[0]);
    } else if (action === "EXECUTE_FILE") {
      response = await executeFile(parsedState, parsedArgs[0], parsedArgs.slice(1));
    } else if (action === "RESOLVE_DIRECTORY_PATH") {
      response = await resolveDirectoryPath(parsedState, parsedArgs[0]);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    if (!response.success && response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }
);
