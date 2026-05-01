import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "sed",
    description: "Stream editor for filtering and transforming text.",
    usage: "sed [-i] 's/pattern/replacement/[flags]' [file...]",
    options: {
        "-i": "Edit file in-place",
    }
};

interface SedExpression {
    pattern: RegExp;
    replacement: string;
    global: boolean;
}

function parseSedExpression(expr: string): SedExpression | null {
    if (!expr.startsWith('s')) return null;

    const delim = expr[1];
    if (!delim) return null;

    const parts: string[] = [];
    let current = '';
    for (let i = 2; i < expr.length; i++) {
        if (expr[i] === '\\' && expr[i + 1] === delim) {
            current += delim;
            i++;
        } else if (expr[i] === delim) {
            parts.push(current);
            current = '';
        } else {
            current += expr[i];
        }
    }
    parts.push(current);

    if (parts.length < 2) return null;

    const [rawPattern, replacement, flagStr = ''] = parts;
    const global = flagStr.includes('g');
    const ignoreCase = flagStr.includes('i');

    let pattern: RegExp;
    try {
        pattern = new RegExp(rawPattern, (global ? 'g' : '') + (ignoreCase ? 'i' : ''));
    } catch {
        return null;
    }

    const jsReplacement = replacement.replace(/\\(\d)/g, '$$$1');

    return { pattern, replacement: jsReplacement, global };
}

function applyExpression(content: string, expr: SedExpression): string {
    return content.replace(expr.pattern, expr.replacement);
}

export const handler: CommandHandler = async ({ opts, state, runtime, stdin }: CommandContext) => {
    const inPlace = opts.hasFlag('i');
    const [rawExpr, ...fileArgs] = opts.args;

    if (!rawExpr) {
        return { stdout: '', stderr: 'bash: sed: missing expression', exitCode: 1 };
    }

    const expr = parseSedExpression(rawExpr);
    if (!expr) {
        return { stdout: '', stderr: `bash: sed: invalid expression: ${rawExpr}`, exitCode: 1 };
    }

    if (fileArgs.length === 0) {
        if (!stdin) {
            return { stdout: '', stderr: 'bash: sed: no input', exitCode: 1 };
        }
        return { stdout: applyExpression(stdin, expr), stderr: '', exitCode: 0 };
    }

    const stdout: string[] = [];
    const stderr: string[] = [];

    await Promise.all(fileArgs.map(async (file) => {
        const absolutePath = await runtime.resolvePath(state, file);

        if (!absolutePath) {
            stderr.push(`bash: sed: ${file}: No such file or directory`);
            return;
        }

        const info = await runtime.executeCode(state, `
            (function() {
                const fs = require('fs');
                const stat = fs.statSync('${absolutePath}');
                if (stat.isDirectory()) return { isDirectory: true };
                return { isDirectory: false, content: fs.readFileSync('${absolutePath}', 'utf8') };
            })()
        `) as { isDirectory: boolean; content?: string };

        if (info.isDirectory) {
            stderr.push(`bash: sed: ${file}: Is a directory`);
            return;
        }

        const result = applyExpression(info.content ?? '', expr);

        if (inPlace) {
            await runtime.executeCode(state, `require('fs').writeFileSync('${absolutePath}', ${JSON.stringify(result)});`);
        } else {
            stdout.push(result);
        }
    }));

    return {
        stdout: stdout.join('\n'),
        stderr: stderr.join('\n'),
        exitCode: stderr.length > 0 ? 1 : 0
    };
};
