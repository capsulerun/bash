import type { BaseRuntime, State } from '@capsule-run/bash-types';

export class StateManager {
  public readonly state: State;

  constructor(
    private readonly runtime: BaseRuntime,
    initialCwd: string = '/workspace',
  ) {
    this.state = {
      cwd: initialCwd,
      env: {},
      lastExitCode: 0,
      absoluteCwd: () => (this.state.cwd.startsWith('/') ? this.state.cwd : `/${this.state.cwd}`),
      setLastExitCode: (code: number) => {
        this.state.lastExitCode = code;
      },
      setEnv: (key: string, value: string) => {
        this.state.env[key] = value;
      },
      changeDirectory: async (targetPath: string) => {
        const resolvedPath = await this.runtime.resolvePath(this.state, targetPath);

        if (!resolvedPath) {
          return false;
        }

        this.state.cwd = resolvedPath as string;
        return true;
      },
    };
  }

  public reset() {
    this.state.cwd = '/workspace';
    this.state.env = {};
    this.state.lastExitCode = 0;
  }
}
