import { describe, it, expect, vi } from 'vitest';
import { handler } from './ls.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('ls command', () => {
  it('should list files excluding hidden ones by default', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('readdirSync')) return ['file1.txt', '.hidden', 'dir1'];
      return {};
    });

    const ctx = createMockContext(
      ['dir'],
      {},
      { resolvePath: resolvePathMock, executeCode: executeCodeMock },
    );
    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('.hidden');
    expect(result.stdout).not.toContain('..');
    expect(result.stdout).toContain('dir1  file1.txt');
  });

  it('should list hidden files with -a', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('readdirSync')) return ['file1.txt', '.hidden'];
      return {};
    });

    const ctx = createMockContext(
      ['-a', 'dir'],
      {},
      { resolvePath: resolvePathMock, executeCode: executeCodeMock },
    );
    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('.hidden');
    expect(result.stdout).toContain('..');
    expect(result.stdout).toContain('.');
    expect(result.stdout).toContain('file1.txt');
  });

  it('should use long format with -l', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('readdirSync')) return ['file1.txt'];
      if (code.includes('statSync'))
        return { mode: 0o100644, size: 1024, nlink: 1, mtime: '2023-01-01T00:00:00.000Z' };
      return {};
    });

    const ctx = createMockContext(
      ['-l', 'dir'],
      {},
      { resolvePath: resolvePathMock, executeCode: executeCodeMock },
    );
    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('total');
    expect(result.stdout).toContain('1024');
    expect(result.stdout).toContain('-rwxr-xr-x');
    expect(result.stdout).toContain('file1.txt');
  });

  it('should support multiple directories', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('dir1')) return ['file_a'];
      if (code.includes('dir2')) return ['file_b'];
      return [];
    });

    const ctx = createMockContext(
      ['dir1', 'dir2'],
      {},
      { resolvePath: resolvePathMock, executeCode: executeCodeMock },
    );
    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('dir1:\n');
    expect(result.stdout).toContain('file_a');
    expect(result.stdout).toContain('dir2:\n');
    expect(result.stdout).toContain('file_b');
  });

  it('should return error for nonexistent directory', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue(undefined);

    const ctx = createMockContext(['nonexistent'], {}, { resolvePath: resolvePathMock });
    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });
});
