import { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";


export const manual: CommandManual = {
    name: 'touch',
    description: 'Create a file',
    usage: 'touch file...'
};

export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
    const stderr: string[] = [];

    await Promise.all(opts.args.map(async (arg) => {
        if (!arg) return;

        const segments = arg.split('/');
        const parentFolder = segments.length > 1 ? segments.slice(0, -1).join('/') : '.';
        
        const parentFolderAbsolutePath = (await runtime.resolvePath(state, parentFolder));

        if (!parentFolderAbsolutePath) {
            stderr.push(`bash: touch: '${arg}': No such file or directory`);
            return;
        }

        const filename = segments[segments.length - 1];
        const absolutePath = `${parentFolderAbsolutePath}/${filename}`.replace('//', '/');

        const exists = await runtime.executeCode(state, `return require('fs').existsSync('${absolutePath}');`) as boolean;
        if (!exists) {
            await runtime.executeCode(state, `require('fs').writeFileSync('${absolutePath}', '');`);
        }
    }))

    return { stdout: 'File created ✔', stderr: stderr.join('\n'), exitCode: stderr.length > 0 ? 1 : 0 };
}
