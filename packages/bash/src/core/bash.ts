import type { BaseRuntime, BashOptions } from "@capsule-run/bash-types";
import { StateManager } from "./stateManager";
import { Filesystem } from "./filesystem";

export class Bash {
    private runtime: BaseRuntime;
    private filesystem: Filesystem;

    public readonly stateManager: StateManager;

    constructor({ runtime, hostWorkspace = ".capsule/session/workspace", initialCwd = "workspace" }: BashOptions) {
        this.runtime = runtime;
        this.runtime.hostWorkspace = hostWorkspace;
        this.stateManager = new StateManager(runtime, initialCwd);
        this.filesystem = new Filesystem(hostWorkspace);

        this.filesystem.init();
    }

    run(command: string) {

    }

    reset() {
        this.filesystem.reset();
        this.stateManager.reset();
    }

}
