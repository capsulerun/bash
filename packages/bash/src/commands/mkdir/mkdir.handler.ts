import { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";


export const manual: CommandManual = {
    name: 'mkdir',
    description: 'Make directories',
    usage: 'mkdir [options] directory...',
    options: {
        '-p': 'Create parent directories as needed',
    },
};



export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
    const stderr: string[] = [];

    await Promise.all(opts.args.map(async (arg) => {
        const segments = arg.split('/');
        const parentFolder = segments.length > 1 ? segments.slice(0, -1).join('/') : '.';

        const parentFolderAbsolutePath = (await runtime.resolvePath(state, parentFolder));

        if(!parentFolderAbsolutePath && arg.includes('..')) {
            stderr.push(`bash: mkdir: '${arg}': Permission denied`);
            return;
        }

        if(!parentFolderAbsolutePath && !opts.hasFlag('p')) {
            stderr.push(`bash: mkdir: '${arg}': No such file or directory`);
            return;
        }

        if(opts.hasFlag('p')) {
            await runtime.executeCode(state, `require('fs').mkdirSync('${arg}', { recursive: true });`)
        } else {
            await runtime.executeCode(state, `require('fs').mkdirSync('${arg}');`)
        }
    }))


    return { stdout: 'Folder created ✔', stderr: stderr.join('\n'), exitCode: stderr.length > 0 ? 1 : 0 };
}
