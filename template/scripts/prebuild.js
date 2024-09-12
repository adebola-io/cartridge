import { existsSync, mkdirSync, writeFile, writeFileSync } from 'node:fs';

export function makeDistStub() {
  if (!existsSync('./dist/server')) {
    mkdirSync('./dist/server', { recursive: true });
  }
  if (!existsSync('./dist/server/entry-server.js')) {
    writeFileSync('./dist/server/entry-server.js', '');
  }
}

makeDistStub();
