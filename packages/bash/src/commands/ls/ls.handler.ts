import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";
import fs from "fs";
import path from "path";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const manual: CommandManual = {
    name: "ls",
    description: "List directory contents.",
    usage: "ls [dir]",
    options: {
        "-l": "Use a long listing format.",
        "-a": "Do not ignore entries starting with .",
        "-la": "Use a long listing format and do not ignore entries starting with ."
    }
};

export const handler: CommandHandler = async ({ opts, state, runtime }: CommandContext) => {
    const targets = opts.args.length > 0 ? opts.args : [state.cwd];
    const multipleDirectories = targets.length > 1;

    const showLong = opts.hasFlag('l');
    const showAll = opts.hasFlag('a');

    let exitCode = 0;
    const stderr: string[] = [];

    for (const target of targets) {
        const resolvedPath = await runtime.resolvePath(state, target);
        if (!resolvedPath && !target.includes('..')) {
            return { stdout: "", stderr: `bash: ls: cannot access '${target}': No such file or directory`, exitCode: 1 };
        }
    }

    const rawResult = await Promise.all(targets.map(async (arg) => {
        const sandboxAbsolutePath = (await runtime.resolvePath(state, arg)) || "/";
        let result = multipleDirectories ? `${arg}:\n` : "";
        let files: string[] = ['.', '..'];

        try {
            const dirFiles = await runtime.executeCode(state, `return require('fs').readdirSync('${sandboxAbsolutePath}');`) as string[];
            files = files.concat(dirFiles);

            files.sort((a, b) => {
                if (a.startsWith(".") && !b.startsWith(".")) return -1;
                if (!a.startsWith(".") && b.startsWith(".")) return 1;
                return a.localeCompare(b);
            });
        } catch (e) {
            stderr.push(`bash: ls: cannot access '${arg}': No such file or directory`);
            exitCode = 1;
            return null;
        }

        if (!showAll) {
            files = files.filter(f => !f.startsWith('.'));
        }

        if (showLong) {
            if (files.length > 0) {
                result += `total ${files.length}\n`;
            }

            const lines = (await Promise.all(files.map(async (filename) => {
                const filepath = path.join(sandboxAbsolutePath, filename);

                try {
                    const unsafeGlobalStats = fs.statSync(path.join(runtime.hostWorkspace as string, filepath));
                    const wasmSafeStats = await runtime.executeCode(state, `return require('fs').statSync('${filepath}');`) as Record<string, string | number>;

                    const isDirectory = wasmSafeStats.mode === 0o40755;
                    const permissions = (isDirectory ? "d" : "-") + "rwxr-xr-x";

                    const hardlink = unsafeGlobalStats.nlink || 1;
                    const user = "Agent";
                    const group = "staff";
                    const size = wasmSafeStats.size || 0;
                    const date = new Date(unsafeGlobalStats.mtime || Date.now());

                    const padDate = date.getDate().toString().padStart(2, ' ');
                    const padHours = date.getHours().toString().padStart(2, '0');
                    const padMins = date.getMinutes().toString().padStart(2, '0');

                    const timeStr = date.getFullYear() !== new Date().getFullYear()
                        ? ` ${date.getFullYear()}`
                        : `${padHours}:${padMins}`;

                    const time = `${months[date.getMonth()]} ${padDate} ${timeStr}`;

                    return `${permissions} ${hardlink} ${user} ${group} ${size} ${time} ${filename}`;
                } catch (err) {
                    return;
                }
            }))).filter((file): file is string => file !== undefined);

            result += lines.join("\n");
        } else {
            result += files.join("  ");
        }

        return result;
    }));

    const validResults = rawResult.filter(r => r !== null);
    const stdout = validResults.join(multipleDirectories ? "\n\n" : "\n") + (validResults.length > 0 ? "\n" : "");

    return { stdout, stderr: stderr.join('\n'), exitCode };
};
