import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

type Props = {
    cwd: string;
    lastExitCode: number;
    running: boolean;
    runningCommand: string;
    onSubmit: (command: string) => void;
    history: string[];
};

export function Prompt({ cwd, lastExitCode, running, runningCommand, onSubmit, history }: Props) {
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);

    const handleSubmit = (value: string) => {
        onSubmit(value);
        setInput('');
        setHistoryIndex(-1);
    };

    useInput((_input, key) => {
        if (running) return;
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

    const promptColor = lastExitCode === 0 ? 'green' : 'red';

    return (
        <Box gap={1}>
            <Text bold dimColor>{cwd}</Text>
            <Text bold color={promptColor}>❯</Text>
            {running ? (
                <>
                    <Text dimColor>{runningCommand}</Text>
                    <Text color="cyan"><Spinner type="dots" /></Text>
                </>
            ) : (
                <TextInput
                    value={input}
                    onChange={(val) => { setInput(val); setHistoryIndex(-1); }}
                    onSubmit={handleSubmit}
                />
            )}
        </Box>
    );
}
