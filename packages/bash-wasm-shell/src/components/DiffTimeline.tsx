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

const TYPE_STYLE: Record<DiffItem['type'], { label: string; color: string }> = {
  created: { label: 'Created', color: 'green' },
  modified: { label: 'Modified', color: 'yellow' },
  deleted: { label: 'Deleted', color: 'red' },
  stdout: { label: 'Stdout', color: 'white' },
  stderr: { label: 'Stderr', color: 'red' },
  exit: { label: 'Exit', color: 'green' },
};

function groupDiffItems(items: DiffItem[]): DiffItem[] {
  return items.reduce<DiffItem[]>((acc, item) => {
    const isDiff = item.type === 'created' || item.type === 'modified' || item.type === 'deleted';
    const prev = acc[acc.length - 1];

    if (isDiff && prev?.type === item.type) {
      prev.filenames = [...(prev.filenames ?? []), ...(item.filenames ?? [])];
      return acc;
    }

    acc.push({ ...item });
    return acc;
  }, []);
}

function contentHeight(item: DiffItem): number {
  const isDiff = item.type === 'created' || item.type === 'modified' || item.type === 'deleted';
  if (isDiff) return (item.filenames?.length ?? 0) + 1;
  if (item.type === 'exit') return 1;
  return (item.content?.split('\n').length ?? 0) + 1;
}

export function DiffTimeline({ entry }: Props) {
  const rawItems: DiffItem[] = [
    ...(entry.diff?.created || []).map((f) => ({ filenames: [f], type: 'created' as const })),
    ...(entry.diff?.modified || []).map((f) => ({ filenames: [f], type: 'modified' as const })),
    ...(entry.diff?.deleted || []).map((f) => ({ filenames: [f], type: 'deleted' as const })),
    ...(entry.stdout ? [{ content: entry.stdout.trimEnd(), type: 'stdout' as const }] : []),
    ...(entry.stderr ? [{ content: entry.stderr.trimEnd(), type: 'stderr' as const }] : []),
    { type: 'exit' as const, exitCode: entry.exitCode, durationMs: entry.durationMs },
  ];

  const items = groupDiffItems(rawItems);

  return (
    <Box flexDirection="column" paddingLeft={2} marginBottom={1} marginTop={1}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const style = TYPE_STYLE[item.type];
        const isDiff =
          item.type === 'created' || item.type === 'modified' || item.type === 'deleted';
        const isExit = item.type === 'exit';
        const exitColor = isExit ? (item.exitCode === 0 ? 'green' : 'red') : style.color;
        const pipeCount = contentHeight(item) + (isLast ? -1 : 1);

        return (
          <Box key={index} flexDirection="row">
            <Box flexDirection="column" marginRight={2} alignItems="center">
              <Text color={isExit ? exitColor : style.color}>●</Text>
              {pipeCount > 0 && (
                <Box flexDirection="column">
                  {Array.from({ length: pipeCount }).map((_, i) => (
                    <Text key={i} dimColor>
                      │
                    </Text>
                  ))}
                </Box>
              )}
            </Box>

            <Box flexDirection="column">
              {isExit ? (
                <Box gap={1}>
                  <Text color={exitColor}>exit {item.exitCode}</Text>
                </Box>
              ) : isDiff ? (
                <Box flexDirection="column" gap={1}>
                  <Text bold>{style.label}</Text>
                  <Box flexDirection="column">
                    {item.filenames?.map((filename, i) => (
                      <Box key={i} flexDirection="row" gap={1}>
                        {item.type === 'created' ? (
                          <Text color={style.color}>[+]</Text>
                        ) : item.type === 'modified' ? (
                          <Text color={style.color}>[~]</Text>
                        ) : (
                          <Text color={style.color}>[-]</Text>
                        )}
                        <Text>{filename}</Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box flexDirection="column">
                  <Text bold dimColor={item.type === 'stderr'}>
                    {style.label}
                  </Text>
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
