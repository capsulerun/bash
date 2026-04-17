import { describe, it, expect, vi } from "vitest";
import { handler } from "./rm.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('rm command', () => {
    it('should return error if no targets specified', async () => {
        const ctx = createMockContext([]);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('missing operand');
    });

    it('should remove a file successfully', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/file.txt');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return false;
            return '';
        });

        const ctx = createMockContext(['file.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('File file.txt removed ✔');
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("unlinkSync('/workspace/file.txt')")
        );
    });

    it('should return error if target does not exist', async () => {
        const resolvePathMock = vi.fn().mockResolvedValue(undefined);
        const ctx = createMockContext(['nonexistent'], {}, { resolvePath: resolvePathMock });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No such file or directory');
    });

    it('should forbid directory removal without flags', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/dir');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return true;
            if (code.includes('readdirSync')) return [];
            return '';
        });

        const ctx = createMockContext(['dir'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('dir: Is a directory');
    });

    it('should remove non-empty directory with -r flag', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async () => '/workspace/dir');
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('statSync') && code.includes('isDirectory')) return true;
            if (code.includes('readdirSync')) return ['file.txt'];
            return '';
        });

        const ctx = createMockContext(['-r', '-f', 'dir'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Folder dir removed ✔');
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("require('fs').rm('/workspace/dir', { recursive: true })")
        );
    });
});
