import { describe, it, expect, vi } from 'vitest';
import { handler } from './wc.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('wc command', () => {
  it('should count from stdin if no file args provided', async () => {
    const ctx = createMockContext([]);
    ctx.stdin = 'hello world\nline 2\n';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('       2');
    expect(result.stdout).toContain('       4');
    expect(result.stdout).toContain('      19');
  });

  it('should respect flags (-l, -w, -c)', async () => {
    const ctx = createMockContext(['-l']);
    ctx.stdin = 'hello world\nline 2\n';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('       2');
    expect(result.stdout).not.toContain('       4');
    expect(result.stdout).not.toContain('      19');
  });

  it('should count from a file', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('isDirectory')) return { isDirectory: false, content: 'file content\n' };
      return {};
    });

    const ctx = createMockContext(
      ['file.txt'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('       1');
    expect(result.stdout).toContain('       2');
    expect(result.stdout).toContain('      13');
    expect(result.stdout).toContain('file.txt');
  });

  it('should handle multiple files and show total', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('file1')) return { isDirectory: false, content: 'content1\n' };
      if (code.includes('file2')) return { isDirectory: false, content: 'content2\nlonger\n' };
      return { isDirectory: false, content: '' };
    });

    const ctx = createMockContext(
      ['file1', 'file2'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('file1');
    expect(result.stdout).toContain('file2');
    expect(result.stdout).toContain('total');
    expect(result.stdout).toContain('       3       3      25 total');
  });

  it('should return error if file does not exist', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue(undefined);
    const ctx = createMockContext(['nonexistent'], {}, { resolvePath: resolvePathMock });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });
});
