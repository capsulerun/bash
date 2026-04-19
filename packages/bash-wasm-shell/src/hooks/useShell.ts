import { useState, useCallback, useEffect } from 'react';
import type { CommandResult } from '@capsule-run/bash-types';
import { bash } from '../bash.js';

export type HistoryEntry = {
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    diff?: {
        created: string[];
        modified: string[];
        deleted: string[];
    };
    state?: {
        cwd: string;
        env: Record<string, string>;
        exitCode: number;
    };
};

export function useShell() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [running, setRunning] = useState(false);
    const [runningCommand, setRunningCommand] = useState('');
    const [lastExitCode, setLastExitCode] = useState(0);
    const [cwd, setCwd] = useState(bash.stateManager.state.cwd);
    const [jsSandboxReady, setJsSandboxReady] = useState(false);
    const [pythonSandboxReady, setPythonSandboxReady] = useState(false);

    useEffect(() => {
        bash.preload("js").then(() => setJsSandboxReady(true)).catch(() => {});
        bash.preload("python").then(() => setPythonSandboxReady(true)).catch(() => {});
    }, []);

    const submit = useCallback(async (command: string) => {
        if (!command.trim()) return;

        if (command.trim() === 'clear') {
            setHistory([]);
            return;
        }

        setRunning(true);
        setRunningCommand(command);

        try {
            const result: CommandResult = await bash.run(command);

            const entry: HistoryEntry = {
                command,
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                durationMs: result.durationMs || 0,
                diff: result.diff,
                state: result.state,
            };

            setLastExitCode(result.exitCode);
            setCwd(bash.stateManager.state.cwd);
            setHistory(prev => [...prev, entry]);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setHistory(prev => [...prev, {
                command,
                stdout: '',
                stderr: message,
                exitCode: 127,
                durationMs: 0,
            }]);
            setLastExitCode(127);
        } finally {
            setRunning(false);
            setRunningCommand('');
        }
    }, []);

    return { history, running, runningCommand, lastExitCode, cwd, submit, jsSandboxReady, pythonSandboxReady };
}
