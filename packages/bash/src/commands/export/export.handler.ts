import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "export",
    description: "Set environment variables.",
    usage: "export"
};

export const handler: CommandHandler = async ({ opts, state }: CommandContext) => {
    for (const arg of opts.args) {
        const equalIdx = arg.indexOf('=');
        if (equalIdx > 0) {
            const key = arg.slice(0, equalIdx);
            const value = arg.slice(equalIdx + 1);
            state.setEnv(key, value);
        } else if (arg.length > 0) {

            if (state.env[arg] === undefined) {
                state.setEnv(arg, '');
            }
        }
    }

    return { stdout: `Environment variables exported ✔`, stderr: '', exitCode: 0 };
};
