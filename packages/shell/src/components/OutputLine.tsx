import React from 'react';
import { Box, Text } from 'ink';
import type { HistoryEntry } from '../hooks/useShell.js';

type Props = {
    entry: HistoryEntry;
};

export function OutputLine({ entry }: Props) {
    return (
        <Box flexDirection="column" marginBottom={1}>
            {/* Command */}
            <Box>
                <Text color="cyan" bold>❯ </Text>
                <Text>{entry.command}</Text>
            </Box>

            {/* Stdout */}
            {entry.stdout && (
                <Text>{entry.stdout}</Text>
            )}

            {/* Stderr */}
            {entry.stderr && (
                <Text color="red">{entry.stderr}</Text>
            )}
        </Box>
    );
}
