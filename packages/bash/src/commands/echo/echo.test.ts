import { describe, it, expect } from "vitest";
import { handler } from "./echo.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('echo command', () => {
    it('should output text with trailing newline', async () => {
        const ctx = createMockContext(['hello', 'world']);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('hello world\n');
    });

    it('should output without trailing newline if -n is passed', async () => {
        const ctx = createMockContext(['-n', 'hello', 'world']);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('hello world');
    });

    it('should not interpret escapes by default', async () => {
        const ctx = createMockContext(['hello\\nworld']);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('hello\\nworld\n');
    });

    it('should interpret escapes if -e is passed', async () => {
        const ctx = createMockContext(['-e', 'hello\\nworld']);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('hello\nworld\n');
    });

    it('should combine flags -n and -e', async () => {
        const ctx = createMockContext(['-e', '-n', 'hello\\tworld']);
        const result = await handler(ctx);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('hello\tworld');
    });
});
