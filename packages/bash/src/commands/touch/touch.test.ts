import { describe, it, expect, vi } from 'vitest';
import { handler } from './touch.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('touch command', () => {
  it('should create a new file if it does not exist', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace');
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('existsSync')) return false;

      return '';
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
    expect(result.stdout).toContain('File created');
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("writeFileSync('/workspace/file.txt', '')"),
    );
  });

  it('should not overwrite an existing file', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace');
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('existsSync')) return true;

      return '';
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
    expect(executeCodeMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("writeFileSync('/workspace/file.txt'"),
    );
  });

  it('should return error if parent directory does not exist', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue(undefined);

    const ctx = createMockContext(
      ['bad/file.txt'],
      {},
      {
        resolvePath: resolvePathMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });

  it('should create multiple files correctly', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace');
    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('existsSync')) return false;

      return '';
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
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("writeFileSync('/workspace/file1.txt'"),
    );
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("writeFileSync('/workspace/file2.txt'"),
    );
  });
});
