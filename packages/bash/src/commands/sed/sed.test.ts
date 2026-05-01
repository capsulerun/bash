import { describe, it, expect, vi } from "vitest";
import { handler } from "./sed.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('sed command', () => {
    it('should return error if missing expression', async () => {
        const ctx = createMockContext([]);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('missing expression');
    });

    it('should process from stdin if no files are provided', async () => {
        const ctx = createMockContext(['s/foo/bar/']);
        ctx.stdin = 'foo baz\nhello foo';

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('bar baz\nhello foo');
    });

    it('should support global flag (g) and custom delimiters', async () => {
        const ctx = createMockContext(['s#foo#bar#g']);
        ctx.stdin = 'foo foo foo';

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('bar bar bar');
    });

    it('should support in-place editing with -i', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/file.txt');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return { isDirectory: false, content: 'edit me' };
            return '';
        });

        const ctx = createMockContext(['-i', 's/edit/fixed/g', 'file.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('');
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining('writeFileSync(\'/workspace/file.txt\', "fixed me")')
        );
    });

    it('should output transformed file content to stdout if not in-place', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/file.txt');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return { isDirectory: false, content: 'edit me' };
            return '';
        });

        const ctx = createMockContext(['s/edit/fixed/g', 'file.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('fixed me');
        expect(executeCodeMock).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining('writeFileSync')
        );
    });

    it('should return error for invalid regex expression', async () => {
        const ctx = createMockContext(['s/some(']); // open parenthesis without closure
        ctx.stdin = 'content';
        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('invalid expression');
    });
});
