import { CustomCommand } from './command';
import type { BaseRuntime } from './runtime';

export interface BashOptions {
  /**
   * The runtime to use for executing commands
   */
  runtime: BaseRuntime;

  /**
   * Array with custom commands added at runtime
   */
  customCommands?: CustomCommand[];

  /**
   * The host workspace directory
   */
  hostWorkspace?: string;

  /**
   * The initial working directory
   */
  initialCwd?: string;
}
