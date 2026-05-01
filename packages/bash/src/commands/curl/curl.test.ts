import { describe, it, expect, vi } from 'vitest';
import { handler } from './curl.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('curl command', () => {
  it('should return error if no URL specified', async () => {
    const ctx = createMockContext(['-s']);
    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('no URL specified');
  });

  it('should construct correct fetch call and return body', async () => {
    const executeCodeMock = vi.fn().mockImplementation(async (_state, code) => {
      if (code.includes('fetch')) {
        return { ok: true, status: 200, body: 'mocked response' };
      }

      return null;
    });

    const ctx = createMockContext(['https://example.com'], {}, { executeCode: executeCodeMock });

    ctx.opts.raw = ['https://example.com'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('mocked response');
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('"https://example.com"'),
    );
  });

  it('should parse headers, method and body correctly', async () => {
    const executeCodeMock = vi.fn().mockImplementation(async (_state, _code) => {
      return { ok: true, status: 201, body: 'created' };
    });

    const ctx = createMockContext(
      [
        '-X',
        'POST',
        '-H',
        'Content-Type: application/json',
        '-d',
        '{"a":1}',
        'https://api.example.com',
      ],
      {},
      { executeCode: executeCodeMock },
    );

    ctx.opts.raw = [
      '-X',
      'POST',
      '-H',
      'Content-Type: application/json',
      '-d',
      '{"a":1}',
      'https://api.example.com',
    ];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('method: "POST"'),
    );
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('{"Content-Type":"application/json"}'),
    );
  });

  it('should save to file with -O flag', async () => {
    const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/index.html');
    const executeCodeMock = vi.fn().mockImplementation(async (_state, code) => {
      if (code.includes('fetch')) {
        return { ok: true };
      }

      return null;
    });

    const ctx = createMockContext(
      ['-O', 'https://example.com/index.html'],
      {},
      {
        resolvePath: resolvePathMock,
        executeCode: executeCodeMock,
      },
    );

    ctx.opts.raw = ['-O', 'https://example.com/index.html'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('File downloaded ✔');
    expect(executeCodeMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("writeFileSync('/workspace/index.html'"),
    );
  });

  it('should return network error without silent flag', async () => {
    const executeCodeMock = vi.fn().mockImplementation(async (_state, _code) => {
      return { ok: false, error: 'Network disconnected' };
    });

    const ctx = createMockContext(['https://example.com'], {}, { executeCode: executeCodeMock });

    ctx.opts.raw = ['https://example.com'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('bash: curl: https://example.com: Network disconnected');
  });

  it('should not output error with silent flag', async () => {
    const executeCodeMock = vi.fn().mockImplementation(async (_state, _code) => {
      return { ok: false, error: 'Network disconnected' };
    });

    const ctx = createMockContext(
      ['-s', 'https://example.com'],
      {},
      { executeCode: executeCodeMock },
    );

    ctx.opts.raw = ['-s', 'https://example.com'];

    const result = await handler(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('');
  });
});
