import { Box, Text } from 'ink';
import type { HistoryEntry } from '../hooks/useShell.js';
import { DiffTimeline } from './DiffTimeline.js';

type Props = {
    entry: HistoryEntry;
};

export function OutputLine({ entry }: Props) {
    return (
        <Box flexDirection="column" gap={0}>
            <Box marginBottom={1}>
                {/* state.cwd */}
                <Text bold>{entry.state?.cwd} ❯ </Text>
                <Text>{entry.command}</Text>
            </Box>

            <DiffTimeline entry={entry} />
        </Box>
    );
}
