import { Box, Static } from 'ink';
import { useShell } from '../hooks/useShell.js';
import { Header } from './Header.js';
import { OutputLine } from './OutputLine.js';
import { Prompt } from './Prompt.js';

export function Shell() {
  const {
    history,
    running,
    cwd,
    lastExitCode,
    submit,
    jsSandboxReady,
    pythonSandboxReady,
    heredoc,
  } = useShell();
  const sandboxReady = jsSandboxReady && pythonSandboxReady;

  const staticItems = sandboxReady
    ? [
        { id: 'header', type: 'header' as const },
        ...history.map((h, i) => ({ id: `h-${i}`, type: 'history' as const, entry: h })),
      ]
    : history.map((h, i) => ({ id: `h-${i}`, type: 'history' as const, entry: h }));

  return (
    <Box flexDirection="column">
      {!sandboxReady && <Header jsReady={jsSandboxReady} pythonReady={pythonSandboxReady} />}

      <Box flexDirection="row" alignItems="flex-start">
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Static items={staticItems}>
            {(item) =>
              item.type === 'header' ? (
                <Header jsReady={jsSandboxReady} pythonReady={pythonSandboxReady} key={item.id} />
              ) : (
                <OutputLine entry={item.entry!} key={item.id} />
              )
            }
          </Static>

          {sandboxReady && (
            <Prompt
              cwd={cwd}
              lastExitCode={lastExitCode}
              running={running}
              onSubmit={submit}
              history={history.map((h) => h.command)}
              heredoc={heredoc}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
