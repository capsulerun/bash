import { vi } from 'vitest';
import type { CommandContext, State, BaseRuntime } from '@capsule-run/bash-types';
import { parsedCommandOptions } from './commandOptions';

export function createMockContext(
    args: string[] = [],
    stateOverrides: Partial<State> = {},
    runtimeOverrides: Partial<BaseRuntime> = {}
): CommandContext {
    return {
        opts: parsedCommandOptions(args),

        state: {
            cwd: '/workspace',
            changeDirectory: vi.fn().mockResolvedValue(true),
            lastExitCode: 0,
            setLastExitCode: vi.fn(),
            env: {},
            setEnv: vi.fn(),
            absoluteCwd: vi.fn().mockReturnValue('/workspace'),
            ...stateOverrides
        } as unknown as State,

        runtime: {
            executeCode: vi.fn().mockResolvedValue(''),
            resolvePath: vi.fn().mockResolvedValue('/workspace'),
            ...runtimeOverrides
        } as unknown as BaseRuntime,

        stdin: ''
    };
}
