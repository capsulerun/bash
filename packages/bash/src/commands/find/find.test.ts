import { describe, it, expect, vi } from 'vitest';
import { handler } from './find.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('find command', () => {
  it('should return error if search path does not exist', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue(undefined);
    const ctx = createMockContext(['nonexistent'], {}, { resolvePath: resolvePathMock });

    ctx.opts.raw = ['nonexistent'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });

  it('should traverse directories and list all files if no flags are provided', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);

    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes("statSync('/workspace/dir')")) {
        return { isDirectory: true, entries: ['file1.txt', 'subdir'] };
      }
      if (code.includes("statSync('/workspace/dir/subdir')")) {
        return { isDirectory: true, entries: ['file2.js'] };
      }

      return { isDirectory: false };
    });

    const ctx = createMockContext(
      ['dir'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    ctx.opts.raw = ['dir'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('dir');
    expect(result.stdout).toContain('dir/file1.txt');
    expect(result.stdout).toContain('dir/subdir');
    expect(result.stdout).toContain('dir/subdir/file2.js');
  });

  it('should filter by -type f', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);

    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes("statSync('/workspace/dir')"))
        return { isDirectory: true, entries: ['f1.txt'] };

      return { isDirectory: false };
    });

    const ctx = createMockContext(
      ['dir', '-type', 'f'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    ctx.opts.raw = ['dir', '-type', 'f'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('dir\n');
    expect(result.stdout).toContain('dir/f1.txt');
  });

  it('should filter by -name pattern', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);

    const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
      if (code.includes("statSync('/workspace/dir')"))
        return { isDirectory: true, entries: ['match.ts', 'ignore.js'] };

      return { isDirectory: false };
    });

    const ctx = createMockContext(
      ['dir', '-name', '*.ts'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    ctx.opts.raw = ['dir', '-name', '*.ts'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('dir/match.ts');
    expect(result.stdout).not.toContain('dir/ignore.js');
  });
});
