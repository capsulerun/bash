import shellQuote from 'shell-quote';

export type RedirectOp = '>' | '>>' | '<';

export type Redirect = {
    op: RedirectOp;
    file: string;
};

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

    parse(input: string): ASTNode {
        this.tokens = (shellQuote.parse(input) as ShellToken[]).filter(
            (t) => !(typeof t === 'object' && 'comment' in t)
        );
        this.pos = 0;
        return this.parseSequence();
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

                redirects.push({ op: (token as { op: RedirectOp }).op, file });
            } else if (isOp(token)) {
                break;
            } else {
                const str = tokenToString(this.consume());
                if (str !== null) args.push(str);
            }
        }

        if (args.length === 0) throw new SyntaxError('Empty command');

        return { type: 'command', args, redirects };
    }
}
