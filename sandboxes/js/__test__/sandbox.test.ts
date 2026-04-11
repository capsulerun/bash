import { describe, it, expect } from 'vitest';
import { run } from '@capsule-run/sdk/runner';
import type { RunnerResult } from '@capsule-run/sdk/runner';
import path from 'path';

const SANDBOX = path.resolve(__dirname, '../sandbox.ts');
const WORKSPACE = '__test__/workspace';

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
      args: ['EXECUTE_FILE', baseState, 'hello.js'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBeDefined();
  });
});

describe('sandbox.ts – EXECUTE_COMMAND', () => {
  it('calls the execute function exported by the script', async () => {
    const script = `
      exports.execute = function(args) {
        return 'executed with ' + args.join(', ');
      };
    `;

    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_COMMAND', baseState, script, 'foo', 'bar'],
      mounts: [`${WORKSPACE}::/`],
    });

    const value = assertSuccess(result);
    expect(value).toBe('executed with foo, bar');
  });

  it('fails when execute is not exported', async () => {
    const script = `const x = 1;`;

    const result = await run({
      file: SANDBOX,
      args: ['EXECUTE_COMMAND', baseState, script],
      mounts: [`${WORKSPACE}::/`],
    });

    const error = assertFailure(result);
    expect(error.message).toContain("execute");
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
