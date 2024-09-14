#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { preflight } from './preflight.js';
import { build } from 'vite';
import { bullet } from '@adbl/bullet/plugin';
import 'colors';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: cartridge <command>\n'.gray);
  console.log('Available Commands:'.gray);
  console.log('  🌟 dev     - Start the development server'.gray);
  console.log(
    '  ⚙️ build    - Build the client and server for production'.gray
  );
  console.log('  🚀 start   - Start the production server'.gray);
  console.log('\nPlease choose a command to proceed.'.green.italic);
  process.exit(0);
}

switch (args[0]) {
  case 'dev': {
    preflight().then(() => {
      execSync('node ./index.js', { stdio: 'inherit' });
    });
    break;
  }
  case 'build':
    preflight().then(() => {
      console.log('Building client...'.blue.italic);
      build({
        root: './',
        build: {
          outDir: 'dist/client',
        },
        plugins: [bullet()],
      }).then(() => {
        console.log('Building server...'.cyan.italic);
        build({
          root: './',
          build: {
            ssr: true,
            rollupOptions: {
              input: './index.js',
            },
            outDir: 'dist/server',
          },
          plugins: [bullet()],
        });
      });
    });
    break;
  case 'start':
    preflight().then(() => {
      execSync('cross-env NODE_ENV=production node dist/server/index.js', {
        stdio: 'inherit',
      });
    });
    break;
  default:
    console.log('Unknown command');
    process.exit(1);
}
