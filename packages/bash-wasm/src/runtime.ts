import path from "path";
import fs from "fs";

import { run } from '@capsule-run/sdk/runner';

import type { BaseRuntime, RuntimeResult, State } from "@capsule-run/bash-types";


export class WasmRuntime implements BaseRuntime {
    private jsSandbox: string;
    private pythonSandbox: string;

    public hostWorkspace: string = "";

    constructor() {
        const jsWasmPath = path.resolve(__dirname, "../dist/sandboxes/js/sandbox.wasm");
        const pyWasmPath = path.resolve(__dirname, "../dist/sandboxes/python/sandbox.wasm");

        if (fs.existsSync(jsWasmPath) && fs.existsSync(pyWasmPath)) {
            this.jsSandbox = jsWasmPath;
            this.pythonSandbox = pyWasmPath;
        } else {
            this.jsSandbox = path.resolve(__dirname, "../../wasm-sandboxes/js/sandbox.ts");
            // We need to install the requirements.txt first to run the python sandbox
            this.pythonSandbox = path.resolve(__dirname, "../../wasm-sandboxes/python/sandbox.py");
        }
    }

    async executeCode(state: State, code: string, language: string = "js"): Promise<unknown> {
        const result = await run({
            file: language === "js" || language === "javascript" ? this.jsSandbox : this.pythonSandbox,
            args: ["EXECUTE_CODE", JSON.stringify(state), code],
            mounts: [`${this.hostWorkspace}::/`],
        })

        return result.result;
    }

    async executeFile(state: State, filePath: string, language: string = "js"): Promise<RuntimeResult> {
        const result = await run({
            file: language === "js" || language === "javascript" ? this.jsSandbox : this.pythonSandbox,
            args: ["EXECUTE_FILE", JSON.stringify(state), filePath],
            mounts: [`${this.hostWorkspace}::/`],
        })

        if (result.error) {
            return {
                stdout: "",
                stderr: result.error.message,
                exitCode: 127,
            }
        }

        return JSON.parse(result.result as string) as RuntimeResult;
    }

    async resolveDirectoryPath(state: State, directoryPath: string): Promise<string> {
        const result = await run({
            file: this.jsSandbox,
            args: ["RESOLVE_DIRECTORY_PATH", JSON.stringify(state), directoryPath],
            mounts: [`${this.hostWorkspace}::/`],
        })

        if (result.error) {
            throw result.error;
        }

        return result.result as string;
    }
}
