import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

type Props = {
    cwd: string;
    running: boolean;
    onSubmit: (command: string) => void;
    sandboxReady: boolean;
    history: string[];
};

export function Prompt({ cwd, running, onSubmit, sandboxReady, history }: Props) {
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);

    const handleSubmit = (value: string) => {
        onSubmit(value);
        setInput('');
        setHistoryIndex(-1);
    };

    useInput((_input, key) => {
        if (running || !sandboxReady) return;

        if (key.upArrow) {
            const nextIndex = Math.min(historyIndex + 1, history.length - 1);
            setHistoryIndex(nextIndex);
            setInput(history[history.length - 1 - nextIndex] ?? '');
        } else if (key.downArrow) {
            const nextIndex = historyIndex - 1;
            if (nextIndex < 0) {
                setHistoryIndex(-1);
                setInput('');
            } else {
                setHistoryIndex(nextIndex);
                setInput(history[history.length - 1 - nextIndex] ?? '');
            }
        }
    });

    return (
        <Box flexDirection="column">
            <Text dimColor>{cwd}</Text>
            <Box gap={1}>
                <Text bold>❯</Text>
                <TextInput
                    value={input}
                    onChange={(val) => { setInput(val); setHistoryIndex(-1); }}
                    onSubmit={handleSubmit}
                />
            </Box>
        </Box>
    );
}
