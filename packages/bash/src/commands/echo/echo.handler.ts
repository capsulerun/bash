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
    let output = opts.args.join(' ');

    if (opts.hasFlag("e")) {
        output = output.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }

    if (!opts.hasFlag("n")) {
        output += "\n";
    }

    return { stdout: output, stderr: '', exitCode: 0 };
};
