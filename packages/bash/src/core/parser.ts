import shellQuote from 'shell-quote';

export type RedirectOp = '>' | '>>' | '<';

export type FileRedirect = {
    op: RedirectOp;
    file: string;
};

export type HereDocRedirect = {
    op: '<<';
    body: string;
};

export type FdRedirect = {
    op: '>&';
    from: number;
    to: number;
};

export type Redirect = FileRedirect | FdRedirect | HereDocRedirect;

export type CommandNode = {
    type: 'command';
    args: string[];
    redirects: Redirect[];
};

export type PipelineNode = {
    type: 'pipeline';
    commands: CommandNode[];
};

export type AndNode = {
    type: 'and';
    left: ASTNode;
    right: ASTNode;
};

export type OrNode = {
    type: 'or';
    left: ASTNode;
    right: ASTNode;
};

export type SequenceNode = {
    type: 'sequence';
    left: ASTNode;
    right: ASTNode;
};

export type ASTNode = CommandNode | PipelineNode | AndNode | OrNode | SequenceNode;

type ShellToken = string | { op: string } | { comment: string } | { pattern: string };

function isOp(token: ShellToken, op?: string): token is { op: string } {
    return typeof token === 'object' && 'op' in token && (op === undefined || token.op === op);
}

function tokenToString(token: ShellToken): string | null {
    if (typeof token === 'string') return token;
    if (typeof token === 'object' && 'pattern' in token) return token.pattern;
    return null;
}

export class Parser {
    private tokens: ShellToken[] = [];
    private pos = 0;
    private heredocs: Map<string, string> = new Map();

    parse(input: string): ASTNode {
        this.heredocs = new Map();
        const processed = this.extractHeredocs(input);
        this.tokens = (shellQuote.parse(processed) as ShellToken[]).filter(
            (t) => !(typeof t === 'object' && 'comment' in t)
        );
        this.pos = 0;
        return this.parseSequence();
    }

    private extractHeredocs(input: string): string {
        const lines = input.split('\n');
        let result = '';
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const match = line.match(/^(.*?)<<\s*'?(\w+)'?\s*(.*)$/);
            if (match) {
                const [, before, delimiter, after] = match;
                const key = `__HEREDOC_${this.heredocs.size}__`;
                const bodyLines: string[] = [];
                i++;
                while (i < lines.length && lines[i].trim() !== delimiter) {
                    bodyLines.push(lines[i]);
                    i++;
                }
                this.heredocs.set(key, bodyLines.join('\n'));
                // Use < instead of << since shell-quote doesn't tokenize << as one op
                result += `${before}< ${key}${after ? ' ' + after : ''}\n`;
            } else {
                result += line + '\n';
            }
            i++;
        }
        return result.trimEnd();
    }

    private peek(): ShellToken | undefined {
        return this.tokens[this.pos];
    }

    private consume(): ShellToken {
        return this.tokens[this.pos++];
    }

    private parseSequence(): ASTNode {
        let left = this.parseAndOr();

        while (isOp(this.peek()!, ';')) {
            this.consume();
            if (this.pos >= this.tokens.length) break;
            const right = this.parseAndOr();
            left = { type: 'sequence', left, right } satisfies SequenceNode;
        }

        return left;
    }

    private parseAndOr(): ASTNode {
        let left = this.parsePipeline();

        while (this.pos < this.tokens.length) {
            const next = this.peek()!;

            if (isOp(next, '&&')) {
                this.consume();
                const right = this.parsePipeline();
                left = { type: 'and', left, right } satisfies AndNode;

            } else if (isOp(next, '||')) {
                this.consume();
                const right = this.parsePipeline();
                left = { type: 'or', left, right } satisfies OrNode;

            } else {
                break;
            }
        }

        return left;
    }

    private parsePipeline(): ASTNode {
        const commands: CommandNode[] = [this.parseCommand()];

        while (isOp(this.peek()!, '|')) {
            this.consume();
            commands.push(this.parseCommand());
        }

        if (commands.length === 1) return commands[0];
        return { type: 'pipeline', commands } satisfies PipelineNode;
    }

    private parseCommand(): CommandNode {
        const args: string[] = [];
        const redirects: Redirect[] = [];

        while (this.pos < this.tokens.length) {
            const token = this.peek()!;

            if (isOp(token, '>') || isOp(token, '>>') || isOp(token, '<')) {
                this.consume();

                const fileToken = this.consume();
                const file = tokenToString(fileToken);

                if (file === null) throw new SyntaxError(`Expected filename after '${(token as { op: string }).op}'`);

                if (isOp(token, '<') && this.heredocs.has(file)) {
                    redirects.push({ op: '<<', body: this.heredocs.get(file)! });
                } else {
                    redirects.push({ op: (token as { op: RedirectOp }).op, file });
                }
            } else if (isOp(token)) {
                break;
            } else {
                const str = tokenToString(token);
                if (
                    str !== null &&
                    /^\d+$/.test(str) &&
                    isOp(this.tokens[this.pos + 1], '>') &&
                    isOp(this.tokens[this.pos + 2], '&') &&
                    /^\d+$/.test(tokenToString(this.tokens[this.pos + 3]) ?? '')
                ) {
                    this.pos += 4;
                    redirects.push({
                        op: '>&',
                        from: parseInt(str),
                        to: parseInt(tokenToString(this.tokens[this.pos - 1])!),
                    });
                } else {
                    if (str !== null) args.push(str);
                    this.consume();
                }
            }
        }

        if (args.length === 0) throw new SyntaxError('Empty command');

        return { type: 'command', args, redirects };
    }
}
