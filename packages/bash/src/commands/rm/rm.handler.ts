import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "rm",
    description: "Remove files or directories.",
    usage: "rm [options] source... destination",
    options: {
        "-f": "Remove files or directories.",
        "-r": "Attempt to remove the file hierarchy rooted in each file argument",
        "-rf": "Attempt to remove the files without prompting for confirmation"
    }
};

export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
    const target = opts.args[0];

    if(!target) {
        return { stdout: '', stderr: `bash: rm: missing file operand`, exitCode: 1 };
    }

    const targetAbsolutePath = await runtime.resolvePath(state, target);
    const isDirectory = await runtime.executeCode(state, `require('fs').statSync('${targetAbsolutePath}').isDirectory();`)
    const isEmpty = (await runtime.executeCode(state, `return require('fs').readdirSync('${targetAbsolutePath}');`) as string[]).length === 0;

    if(!targetAbsolutePath) {
        return { stdout: '', stderr: `bash: rm: ${target}: No such file or directory`, exitCode: 1 };
    }

    if(isDirectory && !opts.hasFlag("r") && !opts.hasFlag("f")) {
        return { stdout: '', stderr: `bash: rm: ${target}: Is a directory`, exitCode: 1 };
    }

    if(!isEmpty && opts.hasFlag("r") && !opts.hasFlag("f")) {
        return { stdout: '', stderr: `bash: rm: ${target}: Directory not empty`, exitCode: 1 };
    }

    if(isEmpty && !opts.hasFlag("r")) {
        await runtime.executeCode(state, `(async () => { await require('fs').rm('${targetAbsolutePath}', { recursive: true }); })();`);
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    if(opts.hasFlag("r") && opts.hasFlag("f")) {
        await runtime.executeCode(state, `(async () => { await require('fs').rm('${targetAbsolutePath}', { recursive: true }); })();`);
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    return { stdout: '', stderr: `bash: rm: ${target}: No such file or directory`, exitCode: 1 };
};
