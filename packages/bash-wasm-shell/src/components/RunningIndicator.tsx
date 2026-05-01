import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

type Props = {
  command: string;
  cwd: string;
};

export function RunningIndicator({ command, cwd }: Props) {
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text dimColor>{cwd}</Text>
        <Text dimColor>❯</Text>
        <Text>{command}</Text>
      </Box>
      <Box paddingLeft={2} gap={1}>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text dimColor>Running…</Text>
      </Box>
    </Box>
  );
}
