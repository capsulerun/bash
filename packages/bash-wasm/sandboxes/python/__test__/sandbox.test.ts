import { describe, it, expect } from 'vitest';
import { run } from '@capsule-run/sdk/runner';
import type { RunnerResult } from '@capsule-run/sdk/runner';
import path from 'path';

const SANDBOX = path.resolve(__dirname, '../sandbox.py');
const relativeWorkspace = path.relative(process.cwd(), path.resolve(__dirname, 'workspace'));
const WORKSPACE = relativeWorkspace.startsWith('.') ? relativeWorkspace : `./${relativeWorkspace}`;

const baseState = JSON.stringify({
  cwd: '/',
  env: {},
  lastExitCode: 0,
});

function assertSuccess(result: RunnerResult) {
  expect(result.success).toBe(true);
  expect(result.error).toBeNull();
  return result.result;
}

function assertFailure(result: RunnerResult) {
  expect(result.success).toBe(false);
  expect(result.error).not.toBeNull();
  return result.error!;
}

describe('sandbox.py – LOAD', () => {
  it('returns a success confirmation', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['PRELOAD', baseState],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe('Sandbox preloaded successfully');
  });
});

describe('sandbox.py – EXECUTE_CODE', () => {
  it('evaluates a simple expression', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, '1 + 1'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe(2);
  });

  it('captures print output', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, 'print("hello")\n42'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(String(value)).toContain('hello');
  });

  it('evaluates multi-line code with a result value', async () => {
    const code = 'x = 10\ny = 20\nx + y';
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, code],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe(30);
  });

  it('propagates raised exceptions as failure', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, 'raise ValueError("boom")'],
      mounts: [`${WORKSPACE}::/`],
    });

    const error = assertFailure(result);
    expect(error.message).toContain('boom');
  });
});

describe('sandbox.py – EXECUTE_FILE', () => {
  it('runs a Python file and returns its result', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_FILE', baseState, 'hello.py'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBeDefined();
  });
});

describe('sandbox.py – invalid action', () => {
  it('throws on unknown action', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['UNKNOWN_ACTION', baseState],
      mounts: [`${WORKSPACE}::/`],
    });

    assertFailure(result);
  });
});
