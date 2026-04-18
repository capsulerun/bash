import { Box, Text } from 'ink';
import type { HistoryEntry } from '../hooks/useShell.js';
import { DiffTimeline } from './DiffTimeline.js';

type Props = {
    entry: HistoryEntry;
};

export function OutputLine({ entry }: Props) {
    return (
        <Box flexDirection="column" gap={0}>
            {/* Command */}
            <Box marginBottom={1}>
                <Text bold>❯ </Text>
                <Text>{entry.command}</Text>
            </Box>

            {/* Output Timeline (Stdout, Stderr, Diffs) */}
            <DiffTimeline entry={entry} />
        </Box>
    );
}
