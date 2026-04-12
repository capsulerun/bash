import type { BaseRuntime, BashOptions, CommandResult } from "@capsule-run/bash-types";
import { StateManager } from "./stateManager";
import { Filesystem } from "./filesystem";
import { Parser } from "./parser";
import { Executor } from "./executor";

export class Bash {
    private runtime: BaseRuntime;
    private filesystem: Filesystem;
    private parser: Parser;
    private executor: Executor;

    public readonly stateManager: StateManager;

    constructor({ runtime, hostWorkspace = ".capsule/session/workspace", initialCwd = "workspace" }: BashOptions) {
        this.runtime = runtime;
        this.runtime.hostWorkspace = hostWorkspace;
        this.stateManager = new StateManager(runtime, initialCwd);
        this.filesystem = new Filesystem(hostWorkspace);
        this.parser = new Parser();
        this.executor = new Executor(runtime, this.stateManager.state);

        this.filesystem.init();
    }

    async run(command: string): Promise<CommandResult> {
        const ast = this.parser.parse(command);
        return this.executor.execute(ast);
    }

    reset() {
        this.filesystem.reset();
        this.stateManager.reset();
    }

}
