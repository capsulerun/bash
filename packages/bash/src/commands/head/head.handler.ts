import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "head",
    description: "Display the first part of files.",
    usage: "head [file]",
    options: {
        "-n": "Display the first n lines",
    }
};

export const handler: CommandHandler = async ({ opts, state, runtime }: CommandContext) => {

    const stderr: string[] = [];
    const stdout: string[] = [];

    const lineNumber = opts.hasFlag("n") ? opts.args[0] : 10;
    const fileArgs = opts.hasFlag("n") ? opts.args.slice(1) : opts.args;
    const multipleFiles = fileArgs.length > 1;

    await Promise.all(fileArgs.map(async (arg) => {
        const destinationAbsolutePath = await runtime.resolvePath(state, arg)

        if(!destinationAbsolutePath) {
            stderr.push(`bash: head: ${arg}: No such file or directory`);
            return;
        }

        const isDirectory = await runtime.executeCode(state, `require('fs').statSync('${destinationAbsolutePath}').isDirectory();`) as boolean;

        if(isDirectory) {
            stderr.push(`bash: head: ${arg}: Is a directory`);
            return;
        }

        const fileContent = await runtime.executeCode(state, `require('fs').readFileSync('${destinationAbsolutePath}', 'utf8').split('\\n').slice(0, ${lineNumber}).join('\\n');`) as string;

        if(multipleFiles) {
            stdout.push(`==> ${arg} <==`);
        }
        stdout.push(fileContent);
    }))

    return { stdout: stdout.join('\n'), stderr: stderr.join('\n'), exitCode: stderr.length > 0 ? 1 : 0 };
};
