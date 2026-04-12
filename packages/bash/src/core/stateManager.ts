import type { BaseRuntime, State } from '@capsule-run/bash-types';

export class StateManager {
  public readonly state: State;

  constructor(private readonly runtime: BaseRuntime, initialCwd: string = 'workspace') {
    this.state = {
      cwd: initialCwd,
      env: {},
      lastExitCode: 0,
      setLastExitCode: (code: number) => {
        this.state.lastExitCode = code;
      },
      setEnv: (key: string, value: string) => {
        this.state.env[key] = value;
      }
    };
  }

  get displayCwd(): string {
    return this.state.cwd.startsWith('/') ? this.state.cwd : `/${this.state.cwd}`;
  }

  public async changeDirectory(targetPath: string): Promise<boolean> {
    try {
      const resolvedPath = await this.runtime.resolvePath(this.state, targetPath);
      this.state.cwd = resolvedPath;
      return true;
    } catch {
      return false;
    }
  }

  public reset() {
    this.state.cwd = 'workspace';
    this.state.env = {};
    this.state.lastExitCode = 0;
  }
}
