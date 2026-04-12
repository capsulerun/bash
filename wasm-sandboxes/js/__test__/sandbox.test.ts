import { describe, it, expect } from 'vitest';
import { run } from '@capsule-run/sdk/runner';
import type { RunnerResult } from '@capsule-run/sdk/runner';
import path from 'path';

const SANDBOX = path.resolve(__dirname, '../sandbox.ts');
const WORKSPACE = '__test__/workspace';

const baseState = JSON.stringify({
  cwd: '.',
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

describe('sandbox.ts – LOAD', () => {
  it('returns a success confirmation', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['LOAD', baseState],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe('Sandbox loaded successfully');
  });
});

describe('sandbox.ts – EXECUTE_CODE', () => {
  it('evaluates a simple expression', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, '1 + 1'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe(2);
  });

  it('captures console.log output', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, 'console.log("hello"); 42'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(String(value)).toContain('hello');
  });

  it('evaluates multi-line code with a return value', async () => {
    const code = `
      const x = 10;
      const y = 20;
      x + y
    `;
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, code],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe(30);
  });

  it('propagates thrown errors as failure', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_CODE', baseState, 'throw new Error("boom")'],
      mounts: [`${WORKSPACE}::/`],
    });

    const error = assertFailure(result);
    expect(error.message).toContain('boom');
  });
});

describe('sandbox.ts – EXECUTE_FILE', () => {
  it('runs a JS file and returns its result', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_FILE', baseState, 'test-file.js'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result) as Record<string, string>;

    expect(value.file1Result).toBe('File 1 imported successfully!');
    expect(value.file2Result).toBe('File 2 imported successfully!');
    expect(value.message).toBe('File test');
  });
});

describe('sandbox.ts – invalid action', () => {
  it('throws on unknown action', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['UNKNOWN_ACTION', baseState],
      mounts: [`${WORKSPACE}::/`],
    });

    assertFailure(result);
  });
});


describe('sandbox.ts – RESOLVE_PATH', () => {
  it('resolves a directory path', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['RESOLVE_PATH', baseState, 'imports'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe('imports');
  });

  it('Should return an error because the directory path does not exist', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['RESOLVE_PATH', baseState, '../non-existent-directory'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertFailure(result);
    expect(value.message).toContain("Path ../non-existent-directory does not exist");
  });

  it('resolves a directory path', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['RESOLVE_PATH', baseState, 'imports/../imports/complex-path-testing'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe('imports/complex-path-testing');
  });

  it('Should works with a different initial cwd', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['RESOLVE_PATH', JSON.stringify({ cwd: 'imports', env: {}, lastExitCode: 0 }), 'complex-path-testing'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe('imports/complex-path-testing');
  });

   it('Should works with a file path', async () => {
    const result = await run({
      file: SANDBOX,
      args: ['RESOLVE_PATH', baseState, 'test-file.js'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe('test-file.js');
  });
});
