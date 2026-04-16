import { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";


export const manual: CommandManual = {
    name: 'touch',
    description: 'Create a file',
    usage: 'touch file...'
};

export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
    const stderr: string[] = [];

    await Promise.all(opts.args.map(async (arg) => {
        const parentFolder = arg.split('/').slice(-1).join('/');

        const parentFolderAbsolutePath = (await runtime.resolvePath(state, parentFolder));

        if (!parentFolderAbsolutePath) {
            stderr.push(`bash: touch: '${arg}': No such file or directory`);
            return;
        }

        if (!await runtime.executeCode(state, `require('fs').existsSync('${arg}');`)) {
            await runtime.executeCode(state, `require('fs').writeFileSync('${arg}', '');`)
        }
    }))

    return { stdout: 'File created ✔', stderr: stderr.join('\n'), exitCode: stderr.length > 0 ? 1 : 0 };
}
