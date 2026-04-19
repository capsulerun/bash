// Shell.tsx
import { Box, Static } from 'ink';
import { useShell } from '../hooks/useShell.js';
import { Header } from './Header.js';
import { OutputLine } from './OutputLine.js';
import { Prompt } from './Prompt.js';


// Shell.tsx
export function Shell() {
    const { history, running, cwd, submit, jsSandboxReady, pythonSandboxReady } = useShell();

    return (
        <Box flexDirection="column">
            {/* Header loading state — fixed at top while loading */}
            {!(jsSandboxReady && pythonSandboxReady) && <Header jsReady={false} pythonReady={false} />}

            {/* History with header once ready */}
            <Static items={jsSandboxReady && pythonSandboxReady ? [{ type: 'header' }, ...history.map(h => ({ type: 'history', entry: h }))] : history.map(h => ({ type: 'history', entry: h }))}>
                {(item: any, index: number) => item.type === 'header' ? <Header jsReady={jsSandboxReady} pythonReady={pythonSandboxReady} key={index} /> : <OutputLine entry={item.entry} key={index} />}
            </Static>

            {/* Prompt */}
            {jsSandboxReady && !running && <Prompt cwd={cwd} running={running} onSubmit={submit} sandboxReady={jsSandboxReady} history={history.map(h => h.command)} />}
        </Box>
    );
}
