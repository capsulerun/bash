import { BaseRuntime } from "./runtime";
import { State } from "./state";

/**
 * The context of a command execution
 */
export interface CommandContext {
    opts: CommandOptions;
    stdin: string;
    state: State;
    runtime: BaseRuntime;
};

/**
 * The result of a command execution
 */
export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs?: number;
    diff?: {
        created: string[];
        modified: string[];
        deleted: string[];
    },
    state?: {
        cwd: string;
        env: Record<string, string>;
        exitCode: number;
    }
};

/**
 * The options of a command execution
 */
export interface CommandOptions {
    raw: string[];
    flags: Set<string>;
    options: Map<string, string>;
    args: string[];
    hasFlag: (...names: string[]) => boolean;
};

/**
 * The manual of a command
 */
export interface CommandManual {
    name: string;
    description: string;
    usage: string;
    options?: Record<string, string>;
};

/**
 * The custom command creation result
 */
export interface CustomCommand {
    name: string;
    handler: CommandHandler;
    manual?: CommandManual;
}

/**
 * The handler of a command execution
 */
export type CommandHandler = (ctx: CommandContext) => Promise<CommandResult>;


/**
 * The builder to create a custom command
 */
export type CreateCustomCommand = (name: string, handler: CommandHandler, manual?: CommandManual) => CustomCommand;



