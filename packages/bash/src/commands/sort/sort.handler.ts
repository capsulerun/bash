import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "sort",
    description: "Sort lines of text.",
    usage: "sort [options] [file...]",
    options: {
        "-r": "Reverse the sort order",
        "-n": "Compare according to string numerical value",
        "-u": "Output only the first of an equal sequence (unique)",
        "-k": "Sort by a key field (1-indexed column number)",
    }
};

export const handler: CommandHandler = async ({ opts, state, runtime, stdin }: CommandContext) => {
    const stderr: string[] = [];

    const reverse = opts.hasFlag("r");
    const numeric = opts.hasFlag("n");
    const unique = opts.hasFlag("u");

    let keyField: number | null = null;
    let kRawValue: string | undefined;

    if (opts.hasFlag("k")) {
        const kRawIndex = opts.raw.indexOf("-k");
        kRawValue = kRawIndex !== -1 ? opts.raw[kRawIndex + 1] : undefined;

        const parsed = kRawValue ? parseInt(kRawValue, 10) : NaN;

        if (isNaN(parsed) || parsed < 1) {
            return { stdout: '', stderr: 'bash: sort: invalid field number for -k', exitCode: 1 };
        }

        keyField = parsed;
    }

    let fileArgs = opts.args.filter(a => a !== kRawValue);

    let lines: string[] = [];

    if (fileArgs.length === 0) {

        if (!stdin) {
            return { stdout: '', stderr: '', exitCode: 0 };
        }

        lines = stdin.split('\n');
    } else {
        for (const arg of fileArgs) {
            const abs = await runtime.resolvePath(state, arg);

            if (!abs) {
                stderr.push(`bash: sort: ${arg}: No such file or directory`);
                continue;
            }

            const isDirectory = await runtime.executeCode(
                state,
                `require('fs').statSync('${abs}').isDirectory();`
            ) as boolean;

            if (isDirectory) {
                stderr.push(`bash: sort: ${arg}: Is a directory`);
                continue;
            }

            const content = await runtime.executeCode(
                state,
                `require('fs').readFileSync('${abs}', 'utf8');`
            ) as string;

            lines.push(...content.split('\n'));
        }
    }

    if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }

    lines.sort((a, b) => {
        const va = keyField !== null ? (a.split(/\s+/)[keyField - 1] ?? '') : a;
        const vb = keyField !== null ? (b.split(/\s+/)[keyField - 1] ?? '') : b;

        if (numeric) {
            return parseFloat(va) - parseFloat(vb);
        }

        return va.localeCompare(vb);
    });

    if (reverse) {
        lines.reverse();
    }

    if (unique) {
        const seen = new Set<string>();
        lines = lines.filter(line => {
            const key = keyField !== null ? (line.split(/\s+/)[keyField - 1] ?? '') : line;

            if (seen.has(key)) return false;
            seen.add(key);

            return true;
        });
    }

    return {
        stdout: lines.join('\n'),
        stderr: stderr.join('\n'),
        exitCode: stderr.length > 0 ? 1 : 0,
    };
};
