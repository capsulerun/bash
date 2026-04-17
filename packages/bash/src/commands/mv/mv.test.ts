import { describe, it, expect, vi } from "vitest";
import { handler } from "./mv.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('mv command', () => {
    it('should return error if missing operands', async () => {
        const ctx = createMockContext(['file1']);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('missing file operand');
    });

    it('should return error if source does not exist', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async (state, path) => {
            if (path === 'nonexistent') return undefined;
            return `/workspace/${path}`;
        });

        const ctx = createMockContext(['nonexistent', 'dest'], {}, { resolvePath: resolvePathMock });
        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No such file or directory');
    });

    it('should rename a file successfully', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async (state, path) => {
            if (path === 'file1.txt') return '/workspace/file1.txt';
            if (path === 'newname.txt') return undefined;
            return undefined;
        });
        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory')) return false;
            return '';
        });

        const ctx = createMockContext(['file1.txt', 'newname.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('File moved ✔');
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("fs.renameSync('/workspace/file1.txt', 'newname.txt')")
        );
    });

    it('should move a file into a directory', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async (state, path) => {
            if (path === 'file1.txt') return '/workspace/file1.txt';
            if (path === 'dir1') return '/workspace/dir1';
            return undefined;
        });

        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes("'isDirectory'") || code.includes('isDirectory()')) {
                if (code.includes('dir1')) return true;
                return false;
            }
            return '';
        });

        const ctx = createMockContext(['file1.txt', 'dir1'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('File moved ✔');
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("fs.copyFile('/workspace/file1.txt'")
        );
    });

    it('should overwrite destination file if it exists and is not a folder', async () => {
        const resolvePathMock = vi.fn().mockImplementation(async (state, path) => {
            if (path === 'file1.txt') return '/workspace/file1.txt';
            if (path === 'file2.txt') return '/workspace/file2.txt';
            return undefined;
        });

        const executeCodeMock = vi.fn().mockImplementation(async (state, code) => {
            if (code.includes('isDirectory()')) return false;
            return '';
        });

        const ctx = createMockContext(['file1.txt', 'file2.txt'], {}, {
            resolvePath: resolvePathMock,
            executeCode: executeCodeMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('File moved ✔');
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("await fs.rm('/workspace/file2.txt'")
        );
    });
});
