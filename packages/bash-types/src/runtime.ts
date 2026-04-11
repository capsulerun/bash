export interface BaseRuntime {
    /**
     * Execute a command
     */
    executeCommand(code: string): Promise<RuntimeResult>;

    /**
     * Execute a code
     */
    executeCode(language: string, code: string): Promise<RuntimeResult>;

    /**
     * Execute a file
     */
    executeFile(language: string, filePath: string): Promise<RuntimeResult>;

    /**
     * Resolve a directory path
     */
    resolveDirectoryPath(directoryPath: string): Promise<string>;
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
