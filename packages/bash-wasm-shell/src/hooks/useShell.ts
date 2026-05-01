import { useState, useCallback, useEffect, useRef } from 'react';
import type { CommandResult } from '@capsule-run/bash-types';
import { bash, preloadPromises } from '../bash.js';

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

export type HeredocState = {
  command: string;
  delimiter: string;
  lines: string[];
};

export function useShell() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [runningCommand, setRunningCommand] = useState('');
  const [lastExitCode, setLastExitCode] = useState(0);
  const [cwd, setCwd] = useState(bash.stateManager.state.cwd);
  const [jsSandboxReady, setJsSandboxReady] = useState(false);
  const [pythonSandboxReady, setPythonSandboxReady] = useState(false);
  const [heredoc, setHeredoc] = useState<HeredocState | null>(null);
  const heredocRef = useRef<HeredocState | null>(null);

  useEffect(() => {
    preloadPromises.js.then(() => setJsSandboxReady(true));
    preloadPromises.python.then(() => setPythonSandboxReady(true));
  }, []);

  const submit = useCallback(async (command: string) => {
    if (!command.trim()) return;

    const current = heredocRef.current;
    if (current) {
      if (command.trim() === current.delimiter) {
        const fullCommand = `${current.command}\n${current.lines.join('\n')}\n${current.delimiter}`;
        heredocRef.current = null;
        setHeredoc(null);
        await submit(fullCommand);
      } else {
        const updated = { ...current, lines: [...current.lines, command] };
        heredocRef.current = updated;
        setHeredoc(updated);
      }
      return;
    }

    const heredocMatch = !command.includes('\n') && command.match(/<<\s*'?(\w+)'?/);
    if (heredocMatch) {
      const next = { command, delimiter: heredocMatch[1], lines: [] };
      heredocRef.current = next;
      setHeredoc(next);
      return;
    }

    if (command.trim() === 'clear') {
      setHistory([]);
      return;
    }

    if (command.trim() === 'exit') {
      process.exit(0);
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
      setHistory((prev) => [...prev, entry]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setHistory((prev) => [
        ...prev,
        {
          command,
          stdout: '',
          stderr: message,
          exitCode: 127,
          durationMs: 0,
        },
      ]);
      setLastExitCode(127);
    } finally {
      setRunning(false);
      setRunningCommand('');
    }
  }, []);

  return {
    history,
    running,
    runningCommand,
    lastExitCode,
    cwd,
    submit,
    jsSandboxReady,
    pythonSandboxReady,
    heredoc,
  };
}
