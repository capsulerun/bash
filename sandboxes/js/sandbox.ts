import { task } from "@capsule-run/sdk";
import path from "path";

import type { State } from "@capsule-run/bash-types";

const executeFile = task(
  { name: "executeFile", compute: "LOW", ram: "256MB" },
  async (state: State, filePath: string, args: string[]) => {
    process.chdir(state.cwd);

    const capturedOutput: string[] = [];
    const absolutePath = path.resolve(state.cwd, filePath);
    process.argv = ['node', absolutePath, ...args];

    console.log = (...logArgs: any[]) => {
      capturedOutput.push(logArgs.map(arg => String(arg)).join(' '));
    };

    const result = require(absolutePath);

    const output = capturedOutput.join('\n');
    if (output) {
      return result && Object.keys(result).length > 0
        ? output + '\n' + JSON.stringify(result)
        : output;
    }

    return result;
  }
)

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

export const executeCommand = task(
  { name: "executeCommand", compute: "LOW", ram: "64MB" },
  async (state: State, scriptContent: string, args: string[]) => {
    process.chdir(state.cwd);
    const exports: { execute?: (args: string[]) => any } = {};

    const moduleWrapper = new Function('exports', scriptContent);

    moduleWrapper(exports);

    if (!exports.execute) {
      throw new Error("Script must export an 'execute' function");
    }

    return await exports.execute(args);
  }
)

export const main = task(
  { name: "main", compute: "HIGH" },
  async (action: string, state: string, ...args: string[]): Promise<unknown> => {
    let response: { success: boolean; result: unknown; error: { message: string } | null };
    let parsedState: State = JSON.parse(state);

    if (action === "LOAD") {
      response = { success: true, result: "Sandbox loaded successfully", error: null };
    } else if (action === "EXECUTE_COMMAND") {
      response = await executeCommand(parsedState, args[0], args.slice(1));
    } else if (action === "EXECUTE_CODE") {
      response = await executeCode(parsedState, args[0]);
    } else if (action === "EXECUTE_FILE") {
      response = await executeFile(parsedState, args[0], args.slice(1));
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    if (!response.success && response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }
);
