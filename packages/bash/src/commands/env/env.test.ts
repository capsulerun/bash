import { describe, it, expect } from "vitest";
import { handler } from "./env.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('env command', () => {
    it('should output all environment variables in KEY=VALUE format', async () => {
        const ctx = createMockContext([], {
            env: {
                USER: 'testuser',
                PATH: '/usr/local/bin:/usr/bin'
            }
        });
        
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('USER=testuser');
        expect(result.stdout).toContain('PATH=/usr/local/bin:/usr/bin');
    });

    it('should output empty string if no env variables exist', async () => {
        const ctx = createMockContext([], { env: {} });
        
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('');
    });
});
