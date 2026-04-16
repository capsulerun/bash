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
    const stdout: string[] = [];
    const stderr: string[] = [];

    await Promise.all(opts.args.map(async (target) => {
        if(!target) {
            stderr.push(`bash: rm: missing file operand`);
            return;
        }

        const targetAbsolutePath = await runtime.resolvePath(state, target);

        if(!targetAbsolutePath) {
            stderr.push(`bash: rm: ${target}: No such file or directory`);
            return;
        }

        const isDirectory = await runtime.executeCode(state, `require('fs').statSync('${targetAbsolutePath}').isDirectory();`)
        const isFile = !isDirectory;
        const isEmpty = isDirectory ? (await runtime.executeCode(state, `return require('fs').readdirSync('${targetAbsolutePath}');`) as string[]).length === 0 : false;

        if(isDirectory && !opts.hasFlag("r") && !opts.hasFlag("f")) {
            stderr.push(`bash: rm: ${target}: Is a directory`);
            return;
        }

        if(isDirectory && !isEmpty && opts.hasFlag("r") && !opts.hasFlag("f")) {
            stderr.push(`bash: rm: ${target}: Directory not empty`);
            return;
        }

        if(isDirectory && isEmpty && !opts.hasFlag("r")) {
            await runtime.executeCode(state, `require('fs').rmdirSync('${targetAbsolutePath}', { recursive: true });`);
            return;
        }

        if(isDirectory && opts.hasFlag("r") && opts.hasFlag("f")) {
            await runtime.executeCode(state, `(async () => { await require('fs').rm('${targetAbsolutePath}', { recursive: true }); })();`);
            return;
        }

        if(isFile) {
            await runtime.executeCode(state, `require('fs').unlinkSync('${targetAbsolutePath}');`);
            return;
        }
    }))

    return { stdout: '', stderr: stderr.join("\n"), exitCode: stderr.length > 0 ? 1 : 0 };
};
