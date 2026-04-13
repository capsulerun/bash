import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "cd",
    description: "Change the working directory.",
    usage: "cd [-L] [dir]",
    options: {
        "-L": "force symbolic links to be followed"
    }
};

export const handler: CommandHandler = async ({ opts, state }: CommandContext) => {

    if(opts.hasFlag('L')) { /* no particular behavior for now */ }

    let targetPath = "/workspace";
    if(opts.positionals[0]) {
        targetPath = opts.positionals[0];
    }

    const success = await state.changeDirectory(targetPath);

    if (!success) {
        return { stdout: '', stderr: `bash: cd: ${targetPath}: No such file or directory`, exitCode: 1 };
    }

    return { stdout: '', stderr: '', exitCode: 0 };
};
