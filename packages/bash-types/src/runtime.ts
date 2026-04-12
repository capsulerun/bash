import { State } from "./state";

export interface BaseRuntime {

    /**
     * The host workspace directory
     */
    hostWorkspace?: string;

    /**
     * Execute a code
     */
    executeCode(state: State, code: string, language: string): Promise<unknown>;

    /**
     * Execute a file
     */
    executeFile(state: State, filePath: string, language: string): Promise<unknown>;

    /**
     * Resolve a directory path
     */
    resolveDirectoryPath(state: State, directoryPath: string): Promise<string>;
}

export interface RuntimeResult {
    /**
     * Standard output
     */
    stdout: string;

    /**
     * Standard error
     */
    stderr: string;

    /**
     * Exit code
     */
    exitCode: number;
}
