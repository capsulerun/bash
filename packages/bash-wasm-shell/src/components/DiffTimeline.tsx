import { Box, Text } from 'ink';
import type { HistoryEntry } from '../hooks/useShell.js';

type Props = {
    entry: HistoryEntry;
};

type DiffItem = {
    filename?: string;
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
    exit:     { label: 'Exit',     color: 'gray'   },
};

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export function DiffTimeline({ entry }: Props) {
    const allItems: DiffItem[] = [
        ...(entry.diff?.created || []).map(f => ({ filename: f, type: 'created' as const })),
        ...(entry.diff?.modified || []).map(f => ({ filename: f, type: 'modified' as const })),
        ...(entry.diff?.deleted || []).map(f => ({ filename: f, type: 'deleted' as const })),
        ...(entry.stdout ? [{ content: entry.stdout.trimEnd(), type: 'stdout' as const }] : []),
        ...(entry.stderr ? [{ content: entry.stderr.trimEnd(), type: 'stderr' as const }] : []),
        { type: 'exit' as const, exitCode: entry.exitCode, durationMs: entry.durationMs },
    ];

    return (
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
            {allItems.map((item, index) => {
                const isLast = index === allItems.length - 1;
                const config = TYPE_CONFIG[item.type];
                const isDiff = item.type === 'created' || item.type === 'modified' || item.type === 'deleted';
                const isExit = item.type === 'exit';
                const contentLines = item.content ? item.content.split('\n').length : 0;
                const numContentLines = isDiff ? 2 : isExit ? 1 : contentLines + 1;
                const pipeCount = (numContentLines - 1) + (isLast ? 0 : 1);
                const exitColor: 'green' | 'red' | TypeConfig['color'] = isExit
                    ? (item.exitCode === 0 ? 'green' : 'red')
                    : config.color;

                return (
                    <Box key={index} flexDirection="row">
                        {/* Timeline Column */}
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

                        {/* Content Column */}
                        <Box flexDirection="column" paddingBottom={isLast ? 0 : 1}>
                            {isExit ? (
                                <Box flexDirection="row" gap={2}>
                                    <Text color={exitColor}>exit {item.exitCode}</Text>
                                    {item.durationMs !== undefined && (
                                        <Text dimColor>{formatDuration(item.durationMs)}</Text>
                                    )}
                                </Box>
                            ) : isDiff ? (
                                <>
                                    <Text bold>{item.filename}</Text>
                                    <Text color={config.color}>{config.label}</Text>
                                </>
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
