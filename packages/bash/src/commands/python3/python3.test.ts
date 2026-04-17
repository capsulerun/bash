import { describe, it, expect, vi } from "vitest";
import { handler } from "./python3.handler";
import { createMockContext } from "../../helpers/testUtils";

describe('python3 command', () => {
    it('should return error if no script specified', async () => {
        const ctx = createMockContext([]);
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('no script specified');
    });

    it('should evaluate inline code correctly with -c', async () => {
        const executeCodeMock = vi.fn().mockResolvedValue('inline output');
        const ctx = createMockContext(['-c', 'print("inline output")'], {}, { executeCode: executeCodeMock });
        
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('inline output');
        expect(executeCodeMock).toHaveBeenCalledWith(expect.anything(), 'print("inline output")', 'python');
    });

    it('should return error if -c is used without code', async () => {
        const ctx = createMockContext(['-c']);
        
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('requires a code argument');
    });

    it('should execute a script file with executeFile', async () => {
        const resolvePathMock = vi.fn().mockResolvedValue('/workspace/script.py');
        const executeFileMock = vi.fn().mockResolvedValue('file output');
        
        const ctx = createMockContext(['script.py', 'arg1', 'arg2'], {}, { 
            resolvePath: resolvePathMock,
            executeFile: executeFileMock 
        });
        
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('file output');
        expect(executeFileMock).toHaveBeenCalledWith(expect.anything(), '/workspace/script.py', ['arg1', 'arg2'], 'python');
    });

    it('should return error if script file does not exist', async () => {
        const resolvePathMock = vi.fn().mockResolvedValue(undefined);
        const ctx = createMockContext(['nonexistent.py'], {}, { resolvePath: resolvePathMock });
        
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No such file or directory');
    });

    it('should capture sandbox execution errors properly', async () => {
        const executeCodeMock = vi.fn().mockRejectedValue(new Error('SyntaxError'));
        const ctx = createMockContext(['-c', 'bad code'], {}, { executeCode: executeCodeMock });
        
        const result = await handler(ctx);
        
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('SyntaxError');
    });
});
