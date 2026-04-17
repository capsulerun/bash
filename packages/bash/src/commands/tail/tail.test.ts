import { describe, it, expect, vi } from "vitest";
import { handler } from "./tail.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('tail command', () => {
    it('should return error if file does not exist', async () => {
        const resolvePathMock = vi.fn().mockResolvedValue(undefined);
        const ctx = createMockContext(['nonexistent.txt'], {}, { resolvePath: resolvePathMock });

        const result = await handler(ctx);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No such file or directory');
    });

    it('should output default 10 lines for single file', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/file.txt');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return false;
            if (code.includes('readFileSync')) return '1\n2\n3\n4\n5\n6\n7\n8\n9\n10';
            return '';
        });

        const ctx = createMockContext(['file.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining('slice(-10)')
        );
        expect(result.stdout).toBe('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');
    });

    it('should slice custom number of lines with -n', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/file.txt');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return false;
            if (code.includes('readFileSync')) return '4\n5';
            return '';
        });

        const ctx = createMockContext(['-n', '2', 'file.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });
        ctx.opts.raw = ['-n', '2', 'file.txt'];

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining('slice(-2)')
        );
        expect(result.stdout).toBe('4\n5');
    });

    it('should print headers for multiple files', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async (state, path) => `/workspace/${path}`);
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return false;
            return 'content';
        });

        const ctx = createMockContext(['file1.txt', 'file2.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('==> file1.txt <==');
        expect(result.stdout).toContain('==> file2.txt <==');
        expect(result.stdout).toContain('content');
    });

    it('should return error if target is a directory', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/dir');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return true;
        });

        const ctx = createMockContext(['dir'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Is a directory');
    });
});
