import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "echo",
    description: "Display text.",
    usage: "echo [text]",
    options: {
        "-n": "Do not output the trailing newline",
        "-e": "Enable interpretation of backslash escapes",
    }
};

export const handler: CommandHandler = async ({ opts }: CommandContext) => {
    const stdout: string[] = [];

    await Promise.all(opts.args.map(async (arg) => {
        let str = !opts.hasFlag("n") ? `${arg}\n` : arg;
        str = !opts.hasFlag("e") ? str.replace(/\\n/g, "\n") : str;

        stdout.push(str);
    }))

    return { stdout: stdout.join(' '), stderr: '', exitCode: 0 };
};
