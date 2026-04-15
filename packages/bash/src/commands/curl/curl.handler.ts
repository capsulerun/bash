import type { CommandContext, CommandHandler, CommandManual } from "@capsule-run/bash-types";

export const manual: CommandManual = {
    name: "curl",
    description: "Transfer data from or to a server.",
    usage: "curl [options] <url>",
    options: {
        "-s": "Silent mode (suppress error messages)",
        "-L": "Follow redirects",
        "-O": "Save output to file named from URL",
        "-X": "HTTP method (GET, POST, PUT, DELETE...)",
        "-H": "Add request header (can be repeated)",
        "-d": "Request body data",
    }
};

interface CurlArgs {
    url: string | null;
    method: string;
    headers: Record<string, string>;
    body: string | null;
    silent: boolean;
    followRedirects: boolean;
    saveToFile: boolean;
}

function parseRawArgs(raw: string[]): CurlArgs {
    const result: CurlArgs = {
        url: null,
        method: 'GET',
        headers: {},
        body: null,
        silent: false,
        followRedirects: false,
        saveToFile: false,
    };

    for (let i = 0; i < raw.length; i++) {
        const arg = raw[i];

        if (arg === '-s') {
            result.silent = true;
        } else if (arg === '-L') {
            result.followRedirects = true;
        } else if (arg === '-O') {
            result.saveToFile = true;
        } else if (arg === '-X' && raw[i + 1]) {
            result.method = raw[++i].toUpperCase();
        } else if (arg === '-H' && raw[i + 1]) {
            const header = raw[++i];
            const colonIdx = header.indexOf(':');
            if (colonIdx !== -1) {
                const key = header.slice(0, colonIdx).trim();
                const value = header.slice(colonIdx + 1).trim();
                result.headers[key] = value;
            }
        } else if (arg === '-d' && raw[i + 1]) {
            result.body = raw[++i];
            // -d implies POST if no -X was given
            if (result.method === 'GET') result.method = 'POST';
        } else if (!arg.startsWith('-')) {
            result.url = arg;
        }
    }

    return result;
}

function filenameFromUrl(url: string): string {
    try {
        const pathname = new URL(url).pathname;
        const name = pathname.split('/').filter(Boolean).pop();
        return name || 'index';
    } catch {
        return 'index';
    }
}

export const handler: CommandHandler = async ({ opts, state, runtime }: CommandContext) => {
    const args = parseRawArgs(opts.raw);

    if (!args.url) {
        return { stdout: '', stderr: 'bash: curl: no URL specified', exitCode: 1 };
    }

    const result = await runtime.executeCode(state, `
        (async function() {
            try {
                const response = await fetch(${JSON.stringify(args.url)}, {
                    method: ${JSON.stringify(args.method)},
                    headers: ${JSON.stringify(args.headers)},
                    ${args.body !== null ? `body: ${JSON.stringify(args.body)},` : ''}
                    redirect: ${JSON.stringify(args.followRedirects ? 'follow' : 'manual')},
                });

                const text = await response.text();
                return { ok: true, status: response.status, body: text };
            } catch (e) {
                return { ok: false, error: String(e) };
            }
        })()
    `) as { ok: boolean; status?: number; body?: string; error?: string };

    if (!result.ok) {
        const msg = `bash: curl: ${args.url}: ${result.error}`;
        return { stdout: '', stderr: args.silent ? '' : msg, exitCode: 1 };
    }

    if (args.saveToFile) {
        const filename = filenameFromUrl(args.url);
        const absolutePath = await runtime.resolvePath(state, filename);
        const targetPath = absolutePath ?? filename;

        await runtime.executeCode(state, `require('fs').writeFileSync('${targetPath}', ${JSON.stringify(result.body ?? '')});`);

        return { stdout: '', stderr: args.silent ? '' : `  % Total\n100  ${(result.body ?? '').length}  Saved to: ${filename}`, exitCode: 0 };
    }

    return { stdout: result.body ?? '', stderr: '', exitCode: 0 };
};
