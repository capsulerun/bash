import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "cd",
    description: "Change the working directory.",
    usage: "cd [-L|[-P] [dir]",
    options: {
        "-L": "force symbolic links to be followed",
        "-P": "use the physical directory structure"
    }
};

export const handler: CommandHandler = async ({ opts, state }: CommandContext) => {
    // console.log(args, opts, state);
    // const targetPath = opts.positionals[0] || state.absoluteCwd();
    // const success = await state.changeDirectory(targetPath);
    return { stdout: '', stderr: '', exitCode: 0 };
};
