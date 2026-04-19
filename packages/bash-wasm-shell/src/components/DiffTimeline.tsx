import { Box, Text } from 'ink';
import type { HistoryEntry } from '../hooks/useShell.js';

type Props = {
    entry: HistoryEntry;
};

type DiffItem = {
    filenames?: string[];
    content?: string;
    type: 'created' | 'modified' | 'deleted' | 'stdout' | 'stderr' | 'exit';
    exitCode?: number;
    durationMs?: number;
};

type TypeConfig = {
    label: string;
    color: 'green' | 'yellow' | 'red' | 'white' | 'gray';
};

const TYPE_CONFIG: Record<DiffItem['type'], TypeConfig> = {
    created:  { label: 'Created',  color: 'green'  },
    modified: { label: 'Modified', color: 'yellow' },
    deleted:  { label: 'Deleted',  color: 'red'    },
    stdout:   { label: 'Stdout',   color: 'white'  },
    stderr:   { label: 'Stderr',   color: 'red'    },
    exit:     { label: 'Exit',     color: 'green'   },
};

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function groupDiffItems(items: DiffItem[]): DiffItem[] {
    return items.reduce<DiffItem[]>((acc, item) => {
        const isDiff = item.type === 'created' || item.type === 'modified' || item.type === 'deleted';
        const prev = acc[acc.length - 1];

        if (isDiff && prev?.type === item.type) {
            prev.filenames = [...(prev.filenames ?? []), ...(item.filenames ?? [])];
            return acc;
        }

        acc.push({ ...item, filenames: item.filenames });
        return acc;
    }, []);
}

export function DiffTimeline({ entry }: Props) {
    const rawItems: DiffItem[] = [
        ...(entry.diff?.created  || []).map(f => ({ filenames: [f], type: 'created'  as const })),
        ...(entry.diff?.modified || []).map(f => ({ filenames: [f], type: 'modified' as const })),
        ...(entry.diff?.deleted  || []).map(f => ({ filenames: [f], type: 'deleted'  as const })),
        ...(entry.stdout ? [{ content: entry.stdout.trimEnd(), type: 'stdout' as const }] : []),
        ...(entry.stderr ? [{ content: entry.stderr.trimEnd(), type: 'stderr' as const }] : []),
        { type: 'exit' as const, exitCode: entry.exitCode, durationMs: entry.durationMs },
    ];

    const allItems = groupDiffItems(rawItems);

    return (
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
            {allItems.map((item, index) => {
                const isLast = index === allItems.length - 1;
                const config = TYPE_CONFIG[item.type];
                const isDiff = item.type === 'created' || item.type === 'modified' || item.type === 'deleted';
                const isExit = item.type === 'exit';
                const contentLines = item.content ? item.content.split('\n').length : 0;
                const numContentLines = isDiff ? (item.filenames?.length || 2) + 1 : isExit ? 1 : contentLines + 1;
                const pipeCount = numContentLines + (isLast ? -1 : 1);
                const exitColor: 'green' | 'red' | TypeConfig['color'] = isExit
                    ? (item.exitCode === 0 ? 'green' : 'red')
                    : config.color;

                return (
                    <Box key={index} flexDirection="row">
                        <Box flexDirection="column" marginRight={2} alignItems="center">
                            <Text color={isExit ? exitColor : config.color}>●</Text>
                            {pipeCount > 0 && (
                                <Box flexDirection="column">
                                    {Array.from({ length: pipeCount }).map((_, i) => (
                                        <Text key={i} dimColor>│</Text>
                                    ))}
                                </Box>
                            )}
                        </Box>


                        <Box flexDirection="column" paddingBottom={isLast ? 0 : 1}>
                            {isExit ? (
                                <Box flexDirection="row" gap={2}>
                                    <Text color={exitColor}>exit {item.exitCode}</Text>
                                </Box>
                            ) : isDiff ? (
                                <Box flexDirection="column" gap={1}>
                                    <Text bold>{config.label}</Text>
                                    <Box flexDirection="column">
                                        {item.filenames?.map((filename, i) => (
                                            <Text key={i}> ➜ {filename}</Text>
                                        ))}
                                    </Box>
                                </Box>
                            ) : (
                                <Box flexDirection="column">
                                    <Text bold dimColor={item.type === 'stderr'}>{config.label}</Text>
                                    <Box marginTop={1}>
                                        <Text dimColor={item.type === 'stderr'}>{item.content}</Text>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}
