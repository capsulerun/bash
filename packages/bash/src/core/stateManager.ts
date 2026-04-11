import path from 'node:path';
import type { BaseRuntime, State } from '@capsule-run/bash-types';

export class StateManager {
  public readonly state: State;
  private runtime: BaseRuntime;

  constructor(runtime: BaseRuntime, initialCwd: string = 'workspace') {
    this.runtime = runtime;
    this.state = {
      cwd: initialCwd,
      env: {},
      lastExitCode: 0
    };
  }

  get displayCwd(): string {
    return this.state.cwd.startsWith('/') ? this.state.cwd : `/${this.state.cwd}`;
  }

  public async changeDirectory(targetPath: string): Promise<void> {
    const resolvedPath = await this.runtime.resolveDirectoryPath(targetPath);
    this.state.cwd = resolvedPath;
  }

  public setEnv(key: string, value: string): void {
    this.state.env[key] = value;
  }

  public setExitCode(code: number): void {
    this.state.lastExitCode = code;
  }

  public reset() {
    this.state.cwd = 'workspace';
    this.state.env = {};
    this.state.lastExitCode = 0;
  }
}
