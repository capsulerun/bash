import React from 'react';
import { Box, Static } from 'ink';
import { useShell } from '../hooks/useShell.js';
import { OutputLine } from './OutputLine.js';
import { Prompt } from './Prompt.js';
import { StatusBar } from './StatusBar.js';

export function Shell() {
    const { history, running, lastExitCode, cwd, submit } = useShell();

    return (
        <Box flexDirection="column">
            {/* History — Static means Ink never re-renders past entries */}
            <Static items={history}>
                {(entry, i) => (
                    <OutputLine key={i} entry={entry} />
                )}
            </Static>

            {/* Prompt */}
            <Prompt cwd={cwd} running={running} onSubmit={submit} />

            {/* Status bar */}
            <StatusBar cwd={cwd} lastExitCode={lastExitCode} />
        </Box>
    );
}
