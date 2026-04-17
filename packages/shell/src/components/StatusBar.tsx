import React from 'react';
import { Box, Text } from 'ink';

type Props = {
    cwd: string;
    lastExitCode: number;
};

export function StatusBar({ cwd, lastExitCode }: Props) {
    const exitColor = lastExitCode === 0 ? 'green' : 'red';

    return (
        <Box
            borderStyle="single"
            borderTop
            borderBottom={false}
            borderLeft={false}
            borderRight={false}
            paddingX={1}
            justifyContent="space-between"
        >
            <Text color="blue" bold>capsule shell</Text>
            <Box gap={2}>
                <Text dimColor>{cwd}</Text>
                <Text color={exitColor}>exit: {lastExitCode}</Text>
                <Text dimColor>ctrl+c to quit</Text>
            </Box>
        </Box>
    );
}
