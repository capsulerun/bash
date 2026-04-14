import { describe, it, expect, vi } from 'vitest';
import { handler } from './cd.handler';
import { createMockContext } from '../../helpers/testUtils';

describe('cd command', () => {
    it('should fall back to /workspace if no path is provided', async () => {
        const changeDirectoryMock = vi.fn().mockResolvedValue(true);
        const ctx = createMockContext([], { changeDirectory: changeDirectoryMock });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(changeDirectoryMock).toHaveBeenCalledWith('/workspace');
    });

    it('should return error if directory does not exist', async () => {
        const changeDirectoryMock = vi.fn().mockResolvedValue(false);
        const ctx = createMockContext(['/fake-dir'], { changeDirectory: changeDirectoryMock });

        const result = await handler(ctx);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No such file or directory');
        expect(changeDirectoryMock).toHaveBeenCalledWith('/fake-dir');
    });
});

