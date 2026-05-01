import { Box, Text, useStdout } from 'ink';
import Spinner from 'ink-spinner';

type Props = {
  jsReady: boolean;
  pythonReady: boolean;
};

function SandboxStatus({ ready, label }: { ready: boolean; label: string }) {
  return (
    <Box gap={1}>
      {ready ? (
        <>
          <Text color="green">●</Text>
          <Text dimColor>{label}</Text>
        </>
      ) : (
        <>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text dimColor>{label}</Text>
        </>
      )}
    </Box>
  );
}

export function Header({ jsReady, pythonReady }: Props) {
  const { stdout } = useStdout();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="#444444"
      width={stdout?.columns || 80}
      paddingX={2}
      paddingY={1}
      marginBottom={1}
    >
      <Box justifyContent="space-between" width="100%">
        <Box flexDirection="column">
          <Text bold>⬢ Capsule Bash</Text>
          <Text dimColor>Environnement v0.1.0</Text>
        </Box>

        <Box flexDirection="column" alignItems="flex-end">
          <SandboxStatus ready={jsReady} label="Sandbox JS" />
          <SandboxStatus ready={pythonReady} label="Sandbox Python" />
        </Box>
      </Box>
    </Box>
  );
}
