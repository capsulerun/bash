import fs from 'fs';
import path from 'path';

export class Filesystem {
    private workspace: string;

    constructor(workspace: string) {
        this.workspace = workspace;
    }

    init() {
        const directories = ['bin', 'dev', 'etc', 'proc', 'root', 'sys', 'tmp', 'workspace'];

        for (const dir of directories) {
            fs.mkdirSync(path.join(this.workspace, dir), { recursive: true });
        }

        const files: Record<string, string> = {
            'etc/resolv.conf': 'nameserver 8.8.8.8\nnameserver 1.1.1.1\n',
            'etc/os-release': 'NAME="Capsule OS"\nVERSION="1.0"\nID=capsule\n',
            'etc/passwd': 'root:x:0:0:root:/root:/bin/bash\n',
            'proc/cpuinfo': 'processor\t: 0\nvendor_id\t: CapsuleVirtualCPU\n',
            'workspace/README.md': '# Welcome to the Capsule Bash Environment\\n\\nYou are operating inside a secure and minimalist sandbox.\\n\\n## Environment Details:\\n- **OS:** Capsule Bash (Mocked Linux)\\n- **Capabilities:** Standard bash operations are supported, but advanced system calls may be restricted.\\n- **Working Directory:** `/workspace` is your designated safe zone.'
        };

        for (const [relativePath, content] of Object.entries(files)) {
            fs.writeFileSync(path.join(this.workspace, relativePath), content);
        }
    }

    reset() {
        fs.rmSync(this.workspace, { recursive: true, force: true });
        this.init();
    }
}
