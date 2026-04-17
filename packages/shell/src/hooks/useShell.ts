import { useState, useCallback } from 'react';
import type { CommandResult } from '@capsule-run/bash-types';
import { bash } from '../bash.js';

export type HistoryEntry = {
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    diff?: {
        created: string[];
        modified: string[];
        deleted: string[];
    };
    state?: {
        cwd: string;
        env: Record<string, string>;
    };
};

export function useShell() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [running, setRunning] = useState(false);
    const [lastExitCode, setLastExitCode] = useState(0);

    const submit = useCallback(async (command: string) => {
        if (!command.trim()) return;

        if (command.trim() === 'clear') {
            setHistory([]);
            return;
        }

        setRunning(true);

        const result: CommandResult = await bash.run(command);

        const entry: HistoryEntry = {
            command,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            diff: result.diff,
            state: result.state,
        };

        setLastExitCode(result.exitCode);
        setHistory(prev => [...prev, entry]);
        setRunning(false);
    }, []);

    const cwd = bash.stateManager.state.cwd;

    return { history, running, lastExitCode, cwd, submit };
}
