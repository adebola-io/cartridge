#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { preflight } from './preflight.js';
import { build } from 'vite';
import { bullet } from '@adbl/bullet/plugin';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: cartridge <command>');
  console.log('Commands:');
  console.log('  dev');
  console.log('  build');
  console.log('  start');
  process.exit(1);
}

switch (args[0]) {
  case 'dev': {
    preflight().then(() => {
      execSync('node ./cartridge-start.js', { stdio: 'inherit' });
    });
    break;
  }
  case 'build':
    preflight().then(() => {
      console.log('Building client...');
      build({
        root: './',
        build: {
          outDir: 'dist/client',
        },
        plugins: [bullet()],
      }).then(() => {
        console.log('Building server...');
        build({
          root: './',
          build: {
            ssr: true,
            rollupOptions: {
              input: './cartridge-start.js',
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
      execSync(
        'cross-env NODE_ENV=production node dist/server/cartridge-start.js',
        {
          stdio: 'inherit',
        }
      );
    });
    break;
  default:
    console.log('Unknown command');
    process.exit(1);
}
