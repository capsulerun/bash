import path from "path";
import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "mv",
    description: "Move files and directories.",
    usage: "mv [options] source... destination",
    options: {
        "-f": "Move files or directories.",
    }
};

export const handler: CommandHandler = async ({ state, opts, runtime }: CommandContext) => {
    const source = opts.args[0];
    const destination = opts.args[1];

    if(!source || !destination) {
        return { stdout: '', stderr: `bash: mv: missing file operand`, exitCode: 1 };
    }

    const sourceAbsolutePath = await runtime.resolvePath(state, source);
    const isSourceFolder = sourceAbsolutePath ? await runtime.executeCode(state, `require('fs').statSync('${sourceAbsolutePath}').isDirectory();`) : false;

    const destinationAbsolutePath = await runtime.resolvePath(state, destination);
    const isDestinationFolder = destinationAbsolutePath ? await runtime.executeCode(state, `require('fs').statSync('${destinationAbsolutePath}').isDirectory();`) : false;

    if(isSourceFolder && !isDestinationFolder) {
        return { stdout: '', stderr: `bash: mv: rename ${source} to ${destination}: Not a directory`, exitCode: 1 };
    }

    if(!sourceAbsolutePath) {
        return { stdout: '', stderr: `bash: mv: ${source}: No such file or directory`, exitCode: 1 };
    }

    if(isDestinationFolder) {
        console.log('sourceAbsolutePath', source)
        console.log('destinationAbsolutePath', destination)

        await runtime.executeCode(state, `(async () => await require('fs').cp('${source}', '${destination}', { recursive: true }))()`);
        await runtime.executeCode(state, `require('fs').rmSync('${sourceAbsolutePath}', { recursive: true });`);
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    if(!isDestinationFolder) {
        console.log('1')
        if(destinationAbsolutePath) {
            await runtime.executeCode(state, `const fs = require('fs');
                fs.rmSync('${destinationAbsolutePath}');
                fs.renameSync('${sourceAbsolutePath}', '${destinationAbsolutePath}');
            `);
        }
        // await runtime.executeCode(state, `require('fs').rmSync('${sourceAbsolutePath}', { recursive: true });`);
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    // if(sourceAbsolutePath && !destinationAbsolutePath) {
    //     try {
    //         await runtime.executeCode(state, `require('fs').renameSync('${sourceAbsolutePath}', '${destination}');`);
    //         return { stdout: '', stderr: '', exitCode: 0 };
    //     } catch (error) {
    //         return { stdout: '', stderr: `bash: mv: ${destination}: No such file or directory`, exitCode: 1 };
    //     }
    // }


    return { stdout: '', stderr: `bash: mv: ${destination}: No such file or directory`, exitCode: 1 };
};
