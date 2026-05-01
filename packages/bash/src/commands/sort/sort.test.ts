import { describe, it, expect, vi } from "vitest";
import { handler } from "./sort.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('sort command', () => {

    it('should return error if file does not exist', async () => {
        const ctx = createMockContext(['missing.txt'], {}, {
            resolvePath: vi.fn().mockResolvedValue(undefined),
        });

        const result = await handler(ctx);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No such file or directory');
    });

    it('should return error if target is a directory', async () => {
        const ctx = createMockContext(['dir'], {}, {
            resolvePath: vi.fn().mockResolvedValue('/workspace/dir'),
            executeCode: vi.fn().mockResolvedValue(true), // isDirectory
        });

        const result = await handler(ctx);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Is a directory');
    });

    it('should sort lines alphabetically from a file', async () => {
        const executeCodeMock = vi.fn().mockImplementation(async (_state, code) => {
            if (code.includes('isDirectory')) return false;
            return 'banana\napple\ncherry\n';
        });

        const ctx = createMockContext(['fruits.txt'], {}, {
            resolvePath: vi.fn().mockResolvedValue('/workspace/fruits.txt'),
            executeCode: executeCodeMock,
        });

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('apple\nbanana\ncherry');
    });

    it('should sort lines from stdin when no file is given', async () => {
        const ctx = createMockContext([], {}, {});
        ctx.stdin = 'banana\napple\ncherry\n';

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('apple\nbanana\ncherry');
    });

    it('should reverse sort with -r', async () => {
        const ctx = createMockContext(['-r'], {}, {});
        ctx.stdin = 'banana\napple\ncherry';

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('cherry\nbanana\napple');
    });

    it('should sort numerically with -n', async () => {
        const ctx = createMockContext(['-n'], {}, {});
        ctx.stdin = '10\n2\n20\n1';

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('1\n2\n10\n20');
    });

    it('should deduplicate lines with -u', async () => {
        const ctx = createMockContext(['-u'], {}, {});
        ctx.stdin = 'apple\nbanana\napple\ncherry\nbanana';

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('apple\nbanana\ncherry');
    });

    it('should sort by key field with -k', async () => {
        const ctx = createMockContext(['-k', '2'], {}, {});
        ctx.stdin = 'foo 3\nbar 1\nbaz 2';

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('bar 1\nbaz 2\nfoo 3');
    });

    it('should return error for invalid -k value', async () => {
        const ctx = createMockContext(['-k', 'abc'], {}, {});
        ctx.stdin = 'foo\nbar';

        const result = await handler(ctx);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('invalid field number');
    });

    it('should sort numerically in reverse with -n -r', async () => {
        const ctx = createMockContext(['-n', '-r'], {}, {});
        ctx.stdin = '10\n2\n20\n1';

        const result = await handler(ctx);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('20\n10\n2\n1');
    });
});
