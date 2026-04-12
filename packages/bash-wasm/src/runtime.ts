import path from "path";
import fs from "fs";

import { run } from '@capsule-run/sdk/runner';

import type { BaseRuntime, State } from "@capsule-run/bash-types";


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

        if (result.error) {
            throw result.error.message;
        }

        return result.result;
    }

    async executeFile(state: State, filePath: string, language: string = "js"): Promise<string> {
        const result = await run({
            file: language === "js" || language === "javascript" ? this.jsSandbox : this.pythonSandbox,
            args: ["EXECUTE_FILE", JSON.stringify(state), filePath],
            mounts: [`${this.hostWorkspace}::/`],
        })

        if (result.error) {
            throw result.error.message;
        }

        return result.result as string;
    }

    async resolvePath(state: State, path: string): Promise<string> {
        const result = await run({
            file: this.jsSandbox,
            args: ["RESOLVE_PATH", JSON.stringify(state), path],
            mounts: [`${this.hostWorkspace}::/`],
        })

        if (result.error) {
            throw result.error.message;
        }

        return result.result as string;
    }
}
