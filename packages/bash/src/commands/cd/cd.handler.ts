import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "cd",
    description: "Change the working directory.",
    usage: "cd [dir]"
};

export const handler: CommandHandler = async ({ opts, state }: CommandContext) => {

    let targetPath = "/workspace";

    if(opts.args.length > 1) {
        return { stdout: '', stderr: `bash: cd: too many arguments`, exitCode: 1 };
    }

    if(opts.args[0] && opts.args[0] !== "~") {
        targetPath = opts.args[0];
    }

    const success = await state.changeDirectory(targetPath);

    if (!success) {
        return { stdout: '', stderr: `bash: cd: ${targetPath}: No such file or directory`, exitCode: 1 };
    }

    return { stdout: `Directory changed to ${targetPath} ✔`, stderr: '', exitCode: 0 };
};
