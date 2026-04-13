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

  /**
   * Get the absolute path of the current working directory
   */
  absoluteCwd(): string;

  /**
   * Change the current working directory
   */
  changeDirectory(targetPath: string): Promise<boolean>;

  /**
   * Set the exit code of the last executed command
   */
  setLastExitCode(code: number): void;

  /**
   * Set an environment variable
   */
  setEnv(key: string, value: string): void;
}
