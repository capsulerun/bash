import { Box, Text } from 'ink';
import type { HistoryEntry } from '../hooks/useShell.js';
import { DiffTimeline } from './DiffTimeline.js';

type Props = {
    entry: HistoryEntry;
};

export function OutputLine({ entry }: Props) {
    const exitColor = entry.exitCode === 0 ? 'green' : 'red';

    return (
        <Box flexDirection="column">
            <Box gap={1}>
                <Text bold dimColor>{entry.state?.cwd ?? '/workspace'}</Text>
                <Text bold color={exitColor}>❯</Text>
                <Text>{entry.command}</Text>
            </Box>
            <DiffTimeline entry={entry} />
        </Box>
    );
}
