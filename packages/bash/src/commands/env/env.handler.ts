import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "env",
    description: "Display environment variables.",
    usage: "env"
};

export const handler: CommandHandler = async ({ opts, state, runtime }: CommandContext) => {
    const stdout: string[] = [];

    Object.entries(state.env).forEach(([key, value]) => {
        stdout.push(`${key}=${value}`);
    });

    return { stdout: stdout.join('\n'), stderr: '', exitCode: 0 };
};
