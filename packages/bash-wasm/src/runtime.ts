import type { BaseRuntime, RuntimeResult } from "@capsule-run/bash-types";

export class WasmRuntime implements BaseRuntime {
    constructor() {}

    async executeCommand(code: string): Promise<RuntimeResult> {
        throw new Error("Method not implemented.");
    }

    async executeCode(language: string, code: string): Promise<RuntimeResult> {
        throw new Error("Method not implemented.");
    }

    async executeFile(language: string, filePath: string): Promise<RuntimeResult> {
        throw new Error("Method not implemented.");
    }

    async resolveDirectoryPath(directoryPath: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
