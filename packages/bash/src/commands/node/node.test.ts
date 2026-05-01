import { describe, it, expect, vi } from 'vitest';
import { handler } from './node.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('node command', () => {
  it('should return error if no file or code specified', async () => {
    const ctx = createMockContext([]);
    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('no script specified');
  });

  it('should evaluate inline code correctly with -e', async () => {
    const executeCodeMock = vi.fn().mockResolvedValue('inline output');
    const ctx = createMockContext(
      ['-e', 'console.log("inline output")'],
      {},
      { executeCode: executeCodeMock },
    );
    ctx.opts.raw = ['-e', 'console.log("inline output")'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('inline output');
    expect(executeCodeMock).toHaveBeenCalledWith(expect.anything(), 'console.log("inline output")');
  });

  it('should return error if -e is used without code', async () => {
    const ctx = createMockContext(['-e']);
    ctx.opts.raw = ['-e'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('requires a code argument');
  });

  it('should execute a script file with executeFile', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue('/workspace/script.js');
    const executeFileMock = vi.fn().mockResolvedValue('file output');

    const ctx = createMockContext(
      ['script.js', 'arg1', 'arg2'],
      {},
      {
        resolvePath: resolvePathMock,
        executeFile: executeFileMock,
      },
    );

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('file output');
    expect(executeFileMock).toHaveBeenCalledWith(expect.anything(), '/workspace/script.js', [
      'arg1',
      'arg2',
    ]);
  });

  it('should return error if script file does not exist', async () => {
    const resolvePathMock = vi.fn().mockResolvedValue(undefined);
    const ctx = createMockContext(['nonexistent.js'], {}, { resolvePath: resolvePathMock });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });

  it('should capture sandbox execution errors properly', async () => {
    const executeCodeMock = vi.fn().mockRejectedValue(new Error('Syntax Error'));
    const ctx = createMockContext(['-e', 'bad code'], {}, { executeCode: executeCodeMock });

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Syntax Error');
  });
});
