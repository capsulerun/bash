import path from 'path';
import type { BaseRuntime, CommandHandler, CommandResult, State } from '@capsule-run/bash-types';
import type { ASTNode, CommandNode } from './parser';

export class Executor {

    constructor(
        private readonly runtime: BaseRuntime,
        private readonly state: State,
    ) {}

    async execute(node: ASTNode, stdin = ''): Promise<CommandResult> {
        switch (node.type) {
            case 'command':  return this.executeCommand(node, stdin);
            case 'pipeline': return this.executePipeline(node);
            case 'and':      return this.executeAnd(node);
            case 'or':       return this.executeOr(node);
            case 'sequence': return this.executeSequence(node);
        }
    }

    private async executeCommand(node: CommandNode, stdin: string): Promise<CommandResult> {
        const [name, ...args] = node.args;

        for (const r of node.redirects) {
            if (r.op === '<') {
                try {
                    stdin = await this.runtime.executeCode(this.state, `
                        const fs = require('fs');
                        const path = require('path');
                        return fs.readFileSync(path.resolve(${JSON.stringify(r.file)}), 'utf8');
                    `) as string;
                } catch {
                    return { stdout: '', stderr: `bash: ${r.file}: No such file or directory`, exitCode: 1 };
                }
            }
        }

        const handler = await this.searchCommandHandler(name);
        let result: CommandResult;

        if (handler) {
            result = await handler({ args, stdin, state: this.state, runtime: this.runtime });
        } else {
            result = { stdout: '', stderr: `bash: ${name}: command not found`, exitCode: 127 };
        }

        for (const r of node.redirects) {
            if (r.op === '>' || r.op === '>>') {
                try {
                    await this.runtime.executeCode(this.state, `
                        const fs = require('fs');
                        const path = require('path');
                        const filePath = path.resolve(${JSON.stringify(r.file)});

                        fs.mkdirSync(path.dirname(filePath), { recursive: true });
                        fs.${r.op === '>>' ? 'appendFileSync' : 'writeFileSync'}(filePath, ${JSON.stringify(result.stdout)});
                    `);

                    result = { ...result, stdout: '' };
                } catch {
                    return { stdout: '', stderr: `bash: ${r.file}: No such file or directory`, exitCode: 1 };
                }
            }
        }

        this.state.setLastExitCode(result.exitCode);
        return result;
    }

    private async executePipeline(node: { type: 'pipeline'; commands: CommandNode[] }): Promise<CommandResult> {
        let stdin = '';
        let result: CommandResult = { stdout: '', stderr: '', exitCode: 0 };

        for (const cmd of node.commands) {
            result = await this.executeCommand(cmd, stdin);
            stdin = result.stdout;
        }

        return result;
    }


    private async executeAnd(node: { type: 'and'; left: ASTNode; right: ASTNode }): Promise<CommandResult> {
        const left = await this.execute(node.left);

        if (left.exitCode !== 0) return left;

        return this.execute(node.right);
    }

    private async executeOr(node: { type: 'or'; left: ASTNode; right: ASTNode }): Promise<CommandResult> {
        const left = await this.execute(node.left);

        if (left.exitCode === 0) return left;

        return this.execute(node.right);
    }

    private async executeSequence(node: { type: 'sequence'; left: ASTNode; right: ASTNode }): Promise<CommandResult> {
        await this.execute(node.left);
        return this.execute(node.right);
    }

    private async searchCommandHandler(name: string): Promise<CommandHandler | undefined> {
        const commandsDir = path.resolve(__dirname, '../commands');
        const handlerPath = path.join(commandsDir, name, 'handler');

        try {
            const mod = require(handlerPath);
            return mod.handle as CommandHandler;
        } catch {
            return undefined;
        }
    }
}
