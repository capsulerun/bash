import type { CommandOptions } from "@capsule-run/bash-types";

export function parsedCommandOptions(args: string[]): CommandOptions {
    const flags: Set<string> = new Set();
    const options: Map<string, string> = new Map();
    const positionals: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg.startsWith('--') && arg.includes('=')) {
            const [key, ...val] = arg.slice(2).split('=');
            options.set(key, val.join('='));
        }
        else if (arg.startsWith('--')) {
            const key = arg.slice(2);
            if (args[i + 1] && !args[i + 1].startsWith('-')) {
                options.set(key, args[++i]);
            } else {
                flags.add(key);
            }
        }
        else if (arg.startsWith('-') && arg.length > 1) {
            for (const char of arg.slice(1)) {
                flags.add(char);
            }
        }

        else {
            positionals.push(arg);
        }
    }

    return {
        raw: args,
        flags,
        options,
        positionals,
        hasFlag: (...names: string[]) => names.some(name => flags.has(name))
    };
}
