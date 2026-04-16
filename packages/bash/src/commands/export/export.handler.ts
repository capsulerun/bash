import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "export",
    description: "Set environment variables.",
    usage: "export"
};

export const handler: CommandHandler = async ({ opts, state }: CommandContext) => {
    for (let i = 0; i < opts.args.length; i += 2) {
        state.setEnv(opts.args[i], opts.args[i + 1]);
    }

    return { stdout: `Environment variables exported ✔`, stderr: '', exitCode: 0 };
};
