import type { BaseRuntime } from "./runtime";

export interface BashOptions {
    /**
     * The runtime to use for executing commands
     */
    runtime: BaseRuntime;

    /**
     * The host workspace directory
     */
    hostWorkspace?: string;

    /**
     * The initial working directory
     */
    initialCwd?: string;
}
