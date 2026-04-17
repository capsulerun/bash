import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "wc",
    description: "Print line, word, and byte counts for each file.",
    usage: "wc [-lwc] [file...]",
    options: {
        "-l": "Print line count",
        "-w": "Print word count",
        "-c": "Print byte count",
    }
};

interface Counts {
    lines: number;
    words: number;
    bytes: number;
}

function count(content: string): Counts {
    const lines = content.split('\n');
    return {
        lines: lines.length - 1,
        words: content.trim() === '' ? 0 : content.trim().split(/\s+/).length,
        bytes: new TextEncoder().encode(content).length,
    };
}

function format(counts: Counts, flags: { lines: boolean; words: boolean; bytes: boolean }, label: string): string {
    const parts: string[] = [];
    if (flags.lines) parts.push(String(counts.lines).padStart(8));
    if (flags.words) parts.push(String(counts.words).padStart(8));
    if (flags.bytes) parts.push(String(counts.bytes).padStart(8));
    return parts.join('') + (label ? ` ${label}` : '');
}

export const handler: CommandHandler = async ({ opts, state, runtime, stdin }: CommandContext) => {
    const showLines = opts.hasFlag('l');
    const showWords = opts.hasFlag('w');
    const showBytes = opts.hasFlag('c');

    const flags = {
        lines: showLines || (!showLines && !showWords && !showBytes),
        words: showWords || (!showLines && !showWords && !showBytes),
        bytes: showBytes || (!showLines && !showWords && !showBytes),
    };

    const fileArgs = opts.args;
    const stdout: string[] = [];
    const stderr: string[] = [];

    if (fileArgs.length === 0) {
        const content = stdin ?? '';
        stdout.push(format(count(content), flags, ''));
        return { stdout: stdout.join('\n'), stderr: '', exitCode: 0 };
    }

    const totals: Counts = { lines: 0, words: 0, bytes: 0 };

    await Promise.all(fileArgs.map(async (file) => {
        const absolutePath = await runtime.resolvePath(state, file);

        if (!absolutePath) {
            stderr.push(`bash: wc: ${file}: No such file or directory`);
            return;
        }

        const info = await runtime.executeCode(state, `
            (function() {
                const fs = require('fs');
                if (fs.statSync('${absolutePath}').isDirectory())
                    return { isDirectory: true };
                return { isDirectory: false, content: fs.readFileSync('${absolutePath}', 'utf8') };
            })()
        `) as { isDirectory: boolean; content?: string };

        if (info.isDirectory) {
            stderr.push(`bash: wc: ${file}: Is a directory`);
            return;
        }

        const c = count(info.content ?? '');
        totals.lines += c.lines;
        totals.words += c.words;
        totals.bytes += c.bytes;
        stdout.push(format(c, flags, file));
    }));

    if (fileArgs.length > 1) {
        stdout.push(format(totals, flags, 'total'));
    }

    return {
        stdout: stdout.join('\n'),
        stderr: stderr.join('\n'),
        exitCode: stderr.length > 0 ? 1 : 0
    };
};
