import { describe, it, expect, vi } from 'vitest';
import { handler } from './cat.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('cat command', () => {
  it('should read file content successfully', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue('/workspace/file.txt');
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('isDirectory')) return false;
      if (code.includes('readFileSync')) return 'hello world';

      return null;
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
    expect(result.stdout).toBe('hello world');
    expect(result.stderr).toBe('');
  });

  it('should concatenate multiple files', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, arg) => `/workspace/${arg}`);
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('isDirectory')) return false;
      if (code.includes('file1.txt')) return 'hello';
      if (code.includes('file2.txt')) return 'world';

      return null;
    });

    const ctx = createMockContext(
      ['file1.txt', 'file2.txt'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello');
    expect(result.stdout).toContain('world');
  });

  it('should return error if file does not exist', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue(undefined);
    const ctx = createMockContext(['nonexistent.txt'], {}, { resolvePath: resolvePathMock });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('bash: cat: nonexistent.txt: No such file or directory');
  });

  it('should return error if path is a directory', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue('/workspace/dir');
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('isDirectory')) return true;

      return null;
    });

    const ctx = createMockContext(
      ['dir'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('bash: cat: dir: Is a directory');
  });
});
