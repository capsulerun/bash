/**
 * Represents the in-memory state of the virtual bash
 */
export interface State {
  /**
   * Current working directory
   */
  cwd: string;

  /**
   * Environment variables
   */
  env: Record<string, string>;

  /**
   * The return code of the last executed command (ex: 0 for success, 1 for error).
   */
  lastExitCode: number;

}
