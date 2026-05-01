import { describe, it, expect, vi } from 'vitest';
import { handler } from './cp.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('cp command', () => {
  it('should return error if missing operands', async () => {
    const ctx = createMockContext(['file1']);
    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('missing file operand');
  });

  it('should return error if source does not exist', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue(undefined);
    const ctx = createMockContext(['nonexistent', 'dest'], {}, { resolvePath: resolvePathMock });
    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });

  it('should copy file to another file successfully', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => {
      if (path === 'file1.txt') return '/workspace/file1.txt';
      if (path === 'newname.txt') return undefined;
      if (path === '.') return '/workspace';

      return undefined;
    });

    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('isDirectory')) return false;

      return '';
    });

    const ctx = createMockContext(
      ['file1.txt', 'newname.txt'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('File copied ✔');
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("require('fs').copyFileSync('/workspace/file1.txt'"),
    );
  });

  it('should copy file into a directory successfully', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => {
      if (path === 'file1.txt') return '/workspace/file1.txt';
      if (path === 'dir1') return '/workspace/dir1';

      return undefined;
    });

    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('isDirectory')) {
        if (code.includes('dir1')) return true;

        return false;
      }

      return '';
    });

    const ctx = createMockContext(
      ['file1.txt', 'dir1'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('File copied ✔');
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("copyFileSync('/workspace/file1.txt'"),
    );
  });

  it('should copy directory recursively with -r flag', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => {
      if (path === 'dir1') return '/workspace/dir1';
      if (path === 'dir2') return undefined;
      if (path === '.') return '/workspace';

      return undefined;
    });

    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes('isDirectory')) {
        if (code.includes('dir1')) return true;

        return false;
      }

      return '';
    });

    const ctx = createMockContext(
      ['-r', 'dir1', 'dir2'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Folder copied ✔');
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("cp('/workspace/dir1', 'dir2', { recursive: true })"),
    );
  });
});
