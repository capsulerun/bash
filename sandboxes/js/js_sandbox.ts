import { task } from "@capsule-run/sdk";
import type { State } from "@capsule-run/bash-types";

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
  async (state: State, scriptContent: string, args: any[]) => {
    process.chdir(state.cwd);
    const exports: { execute?: (args: any[]) => any } = {};

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
  async (action: string, state: State, ...args: string[]): Promise<unknown> => {
    let response: { success: boolean; result: unknown; error: { message: string } | null };

    if (action === "LOAD") {
      response = { success: true, result: "Sandbox loaded successfully", error: null };
    } else if (action === "EXECUTE_COMMAND") {
      response = await executeCommand(state, ...args as [string, any[]]);
    } else if (action === "EXECUTE_CODE") {
      response = await executeCode(state, ...args as [string]);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    if (!response.success && response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }
);
