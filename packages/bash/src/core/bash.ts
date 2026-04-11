import type { BaseRuntime, BashOptions } from "@capsule-run/bash-types";
import { StateManager } from "./stateManager";
import { Filesystem } from "./filesystem";

export class Bash {
    private runtime: BaseRuntime;
    private filesystem: Filesystem;

    public readonly state: StateManager;

    constructor({ runtime, initialCwd = "workspace" }: BashOptions) {
        this.runtime = runtime;
        this.filesystem = new Filesystem(".capsule/session/workspace");
        this.state = new StateManager(runtime, initialCwd);

        this.filesystem.init();
    }

    run(command: string) {
        this.runtime.executeCommand(command);
    }

    reset() {
        this.filesystem.reset();
        this.state.reset();
    }

}
