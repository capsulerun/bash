import { describe, it, expect } from "vitest";
import { handler } from "./pwd.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('pwd command', () => {
    it('should return the current working directory', async () => {
        const ctx = createMockContext([], { cwd: '/workspace/my-dir' });
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('/workspace/my-dir');
    });

    it('should return error if arguments are passed', async () => {
        const ctx = createMockContext(['extra-arg']);
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('too many arguments');
    });
});
