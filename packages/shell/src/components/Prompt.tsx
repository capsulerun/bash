import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

type Props = {
    cwd: string;
    running: boolean;
    onSubmit: (command: string) => void;
};

export function Prompt({ cwd, running, onSubmit }: Props) {
    const [input, setInput] = useState('');

    const handleSubmit = (value: string) => {
        onSubmit(value);
        setInput('');
    };

    return (
        <Box>
            <Text color="green" bold>{cwd} </Text>
            <Text color="cyan" bold>❯ </Text>
            {running ? (
                <Text dimColor>running…</Text>
            ) : (
                <TextInput
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                />
            )}
        </Box>
    );
}
