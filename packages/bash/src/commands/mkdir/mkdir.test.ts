import { describe, it, expect, vi } from "vitest";
import { handler } from "./mkdir.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('mkdir command', () => {
    it('should create a directory successfully', async () => {
        const executeCodeMock = vi.fn().mockResolvedValue('');
        const resolvePathMock = vi.fn().mockResolvedValue('/workspace');

        const ctx = createMockContext(['test_dir'], {}, {
            executeCode: executeCodeMock,
            resolvePath: resolvePathMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Folder created ✔');
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("require('fs').mkdirSync('test_dir');")
        );
    });

    it('should return error if parent directory does not exist and -p is not provided', async () => {
        const resolvePathMock = vi.fn().mockResolvedValue(undefined);

        const ctx = createMockContext(['nonexistent/test_dir'], {}, {
            resolvePath: resolvePathMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("bash: mkdir: 'nonexistent/test_dir': No such file or directory");
    });

    it('should create parent directories if -p flag is provided', async () => {
        const executeCodeMock = vi.fn().mockResolvedValue('');
        const resolvePathMock = vi.fn().mockResolvedValue(undefined);

        const ctx = createMockContext(['-p', 'nonexistent/test_dir'], {}, {
            executeCode: executeCodeMock,
            resolvePath: resolvePathMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(executeCodeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("mkdirSync('nonexistent/test_dir', { recursive: true })")
        );
    });

    it('should deny permission when traversing out of bounds', async () => {
        const resolvePathMock = vi.fn().mockResolvedValue(undefined);

        const ctx = createMockContext(['../../test_dir'], {}, {
            resolvePath: resolvePathMock
        });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("Permission denied");
    });
});
