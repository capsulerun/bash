import { CommandManual } from '@capsule-run/bash-types';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export class Filesystem {
  constructor(private readonly workspace: string) {}

  init() {
    const directories = ['bin', 'dev', 'etc', 'proc', 'root', 'sys', 'tmp', 'workspace'];

    for (const dir of directories) {
      fs.mkdirSync(path.join(this.workspace, dir), { recursive: true });
    }

    let commandManuals = '';
    const commandsDir = path.resolve(__dirname, '../commands');

    for (const command of fs.readdirSync(commandsDir)) {
      const commandDir = path.join(commandsDir, command);

      if (!fs.statSync(commandDir).isDirectory()) {
        continue;
      }

      const commandPath = path.join(commandDir, `${command}.handler`);

      const mod = require(commandPath);
      const man = mod.manual as CommandManual;

      commandManuals += `-

Command: ${man.name}
Usage: ${man.usage}
Description: ${man.description}${
        man.options
          ? `\nOptions:\n${Object.entries(man.options)
              .map(([key, value]) => `${key} : ${value}`)
              .join('\n')}`
          : ''
      }\n\n`;
    }

    const files: Record<string, string> = {
      'etc/resolv.conf': 'nameserver 8.8.8.8\nnameserver 1.1.1.1\n',
      'etc/os-release': 'NAME="Capsule OS"\nVERSION="1.0"\nID=capsule\n',
      'etc/passwd': 'root:x:0:0:root:/root:/bin/bash\n',
      'proc/cpuinfo': 'processor\t: 0\nvendor_id\t: CapsuleVirtualCPU\n',
      'workspace/manual.md': `# Capsule Bash Manual\n\n## Available commands:\n${commandManuals}`,
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
