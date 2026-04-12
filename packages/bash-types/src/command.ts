import { BaseRuntime } from "./runtime";
import { State } from "./state";

/**
 * The context of a command execution
 */
export type CommandContext = {
    opts: CommandOptions;
    stdin: string;
    state: State;
    runtime: BaseRuntime;
};

/**
 * The handler of a command execution
 */
export type CommandHandler = (ctx: CommandContext) => Promise<CommandResult>;

/**
 * The result of a command execution
 */
export type CommandResult = {
    stdout: string;
    stderr: string;
    exitCode: number;
};


/**
 * The options of a command execution
 */
export type CommandOptions  = {
    raw: string[];
    flags: Set<string>;
    options: Map<string, string>;
    positionals: string[];
    hasFlag: (...names: string[]) => boolean;
};

/**
 * The manual of a command
 */
export type CommandManual = {
    name: string;
    description: string;
    usage: string;
    options?: Record<string, string>;
};

