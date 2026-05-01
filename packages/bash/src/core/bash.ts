import type {
  BaseRuntime,
  BashOptions,
  CommandResult,
  CustomCommand,
} from '@capsule-run/bash-types';
import { StateManager } from './stateManager';
import { Filesystem } from './filesystem';
import { Parser } from './parser';
import { Executor } from './executor';

export class Bash {
  private runtime: BaseRuntime;
  private filesystem: Filesystem;
  private parser: Parser;
  private executor: Executor;
  private customCommands: CustomCommand[];
  public isPythonSandboxReady: boolean;
  public isJsSandboxReady: boolean;

  public readonly stateManager: StateManager;

  constructor({
    runtime,
    customCommands = [],
    hostWorkspace = '.capsule/session/workspace',
    initialCwd = '/workspace',
  }: BashOptions) {
    this.runtime = runtime;
    this.runtime.hostWorkspace = hostWorkspace;
    this.customCommands = customCommands;

    this.stateManager = new StateManager(runtime, initialCwd);
    this.filesystem = new Filesystem(hostWorkspace);
    this.parser = new Parser();
    this.executor = new Executor(runtime, this.customCommands, this.stateManager.state);

    this.filesystem.init();

    this.isPythonSandboxReady = false;
    this.isJsSandboxReady = false;
  }

  async preload(name: string = 'js') {
    const ready = await this.runtime.preload(this.stateManager.state, name);

    if (name === 'js') {
      this.isJsSandboxReady = ready;
    } else if (name === 'python') {
      this.isPythonSandboxReady = ready;
    }
  }

  async run(command: string): Promise<CommandResult> {
    if (!this.isJsSandboxReady) {
      await this.preload('js');
    }

    if (command.includes('python') && !this.isPythonSandboxReady) {
      await this.preload('python');
    }

    const ast = this.parser.parse(command);
    return this.executor.execute(ast);
  }

  reset() {
    this.filesystem.reset();
    this.stateManager.reset();
  }
}
