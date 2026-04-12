import { BaseRuntime } from "./runtime";
import { State } from "./state";

/**
 * The context of a command execution
 */
export type CommandContext = {
    args: string[];
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


