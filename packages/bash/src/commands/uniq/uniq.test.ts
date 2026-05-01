import { describe, it, expect, vi } from 'vitest';
import { handler } from './uniq.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('uniq command', () => {
  it('should return error if file does not exist', async () => {
    const ctx = createMockContext(
      ['missing.txt'],
      {},
      {
        resolvePath: vi.fn().mockResolvedValue(undefined),
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });

  it('should return error if target is a directory', async () => {
    const ctx = createMockContext(
      ['dir'],
      {},
      {
        resolvePath: vi.fn().mockResolvedValue('/workspace/dir'),
        executeCode: vi.fn().mockResolvedValue(true),
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Is a directory');
  });

  it('should filter adjacent duplicate lines from stdin', async () => {
    const ctx = createMockContext([], {}, {});

    ctx.stdin = 'apple\napple\nbanana\ncherry\ncherry\ncherry';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('apple\nbanana\ncherry');
  });

  it('should filter adjacent duplicate lines from a file', async () => {
    const executeCodeMock = vi.fn().mockImplementation(async (_state, code) => {
      if (code.includes('isDirectory')) return false;

      return 'apple\napple\nbanana\n';
    });

    const ctx = createMockContext(
      ['fruits.txt'],
      {},
      {
        resolvePath: vi.fn().mockResolvedValue('/workspace/fruits.txt'),
        executeCode: executeCodeMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('apple\nbanana');
  });

  it('should prefix lines with count with -c', async () => {
    const ctx = createMockContext(['-c'], {}, {});

    ctx.stdin = 'apple\napple\nbanana\ncherry\ncherry\ncherry';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('   2 apple\n   1 banana\n   3 cherry');
  });

  it('should only print duplicate lines with -d', async () => {
    const ctx = createMockContext(['-d'], {}, {});

    ctx.stdin = 'apple\napple\nbanana\ncherry\ncherry\ncherry';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('apple\ncherry');
  });

  it('should only print unique lines with -u', async () => {
    const ctx = createMockContext(['-u'], {}, {});

    ctx.stdin = 'apple\napple\nbanana\ncherry\ncherry\ncherry';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('banana');
  });

  it('should compare case-insensitively with -i', async () => {
    const ctx = createMockContext(['-i'], {}, {});

    ctx.stdin = 'Apple\napple\nBANANA\nbanana';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('Apple\nBANANA');
  });

  it('should not collapse non-adjacent duplicates', async () => {
    const ctx = createMockContext([], {}, {});

    ctx.stdin = 'apple\nbanana\napple';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('apple\nbanana\napple');
  });

  it('should return empty output for empty stdin', async () => {
    const ctx = createMockContext([], {}, {});

    ctx.stdin = '';

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
  });
});
