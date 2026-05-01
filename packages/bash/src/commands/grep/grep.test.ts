import { describe, it, expect, vi } from 'vitest';
import { handler } from './grep.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('grep command', () => {
  it('should return error if missing pattern', async () => {
    const ctx = createMockContext([]);
    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('missing pattern');
  });

  it('should search from stdin if no file args provided', async () => {
    const ctx = createMockContext(['hello']);

    ctx.stdin = 'hello world\nignore this\nsay hello';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('hello world\nsay hello');
  });

  it('should search in a single file', async () => {
    const resolvePathMock = vi
      .fn()
      .mockImplementation(async (_state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (_state, _code) => {
      return { isDirectory: false, content: 'hello world\nignore this\nsay hello' };
    });

    const ctx = createMockContext(
      ['hello', 'file.txt'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('hello world\nsay hello');
  });

  it('should append prefix for multiple files', async () => {
    const resolvePathMock = vi
      .fn()
      .mockImplementation(async (_state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (_state, _code) => {
      return { isDirectory: false, content: 'hello world\nignore this\nsay hello' };
    });

    const ctx = createMockContext(
      ['hello', 'file1.txt', 'file2.txt'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('file1.txt:hello world');
    expect(result.stdout).toContain('file2.txt:say hello');
  });

  it('should apply -i ignore case and -n line number flags', async () => {
    const ctx = createMockContext(['-i', '-n', 'HELLO']);

    ctx.stdin = 'Hello world\nignore this\nsay hello';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('1:Hello world\n3:say hello');
  });

  it('should return error for directories without -r', async () => {
    const resolvePathMock = vi
      .fn()
      .mockImplementation(async (_state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (_state, _code) => {
      return { isDirectory: true, entries: ['file.txt'] };
    });

    const ctx = createMockContext(
      ['hello', 'dir'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('bash: grep: dir: Is a directory');
  });

  it('should recurse with -r flag', async () => {
    const resolvePathMock = vi
      .fn()
      .mockImplementation(async (_state, path) => `/workspace/${path}`);
    const executeCodeMock = vi.fn().mockImplementation(async (_state, code) => {
      if (code.includes("/workspace/dir'")) return { isDirectory: true, entries: ['file'] };

      return { isDirectory: false, content: 'hello inside!' };
    });

    const ctx = createMockContext(
      ['-r', 'hello', 'dir'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('dir/file:hello inside!');
  });

  it('should return only matched parts with -o flag', async () => {
    const ctx = createMockContext(['-o', 'hello']);

    ctx.stdin = 'say hello world\nignore this\nhello again hello';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('hello\nhello\nhello');
  });
});
