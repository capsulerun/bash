// Shell.tsx
import { Box, Static } from 'ink';
import { useShell } from '../hooks/useShell.js';
import { Header } from './Header.js';
import { OutputLine } from './OutputLine.js';
import { Prompt } from './Prompt.js';


// Shell.tsx
export function Shell() {
    const { history, running, cwd, submit, sandboxReady } = useShell();

    return (
        <Box flexDirection="column">
            {/* Header loading state — fixed at top while loading */}
            {!sandboxReady && <Header ready={false} />}

            {/* History with header once ready */}
            <Static items={sandboxReady ? [{ type: 'header' }, ...history.map(h => ({ type: 'history', entry: h }))] : history.map(h => ({ type: 'history', entry: h }))}>
                {(item: any, index: number) => item.type === 'header' ? <Header ready={true} key={index} /> : <OutputLine entry={item.entry} key={index} />}
            </Static>

            {/* Prompt */}
            {sandboxReady && !running && <Prompt cwd={cwd} running={running} onSubmit={submit} sandboxReady={sandboxReady} history={history.map(h => h.command)} />}
        </Box>
    );
}
