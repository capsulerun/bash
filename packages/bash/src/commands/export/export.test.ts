import { describe, it, expect, vi } from 'vitest';
import { handler } from './export.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('export command', () => {
  it('should export a single variable with key=value format', async () => {
    const setEnvMock = vi.fn();
    const ctx = createMockContext(['FOO=bar'], { setEnv: setEnvMock });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Environment variables exported');
    expect(setEnvMock).toHaveBeenCalledWith('FOO', 'bar');
  });

  it('should export multiple variables correctly', async () => {
    const setEnvMock = vi.fn();
    const ctx = createMockContext(['FOO=bar', 'BAZ=qux'], { setEnv: setEnvMock });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(setEnvMock).toHaveBeenCalledWith('FOO', 'bar');
    expect(setEnvMock).toHaveBeenCalledWith('BAZ', 'qux');
  });

  it('should set undefined variable to empty string if no equals is provided', async () => {
    const setEnvMock = vi.fn();
    const ctx = createMockContext(['FOO'], { setEnv: setEnvMock, env: {} });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(setEnvMock).toHaveBeenCalledWith('FOO', '');
  });

  it('should handle values with equals signs in them', async () => {
    const setEnvMock = vi.fn();
    const ctx = createMockContext(['SECRET=base64=='], { setEnv: setEnvMock });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(setEnvMock).toHaveBeenCalledWith('SECRET', 'base64==');
  });
});
