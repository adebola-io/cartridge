#!/usr/bin/env node

import { build } from 'vite';
import { bullet } from '@adbl/bullet/plugin';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import 'colors';
import { ErrorMessages } from './library/error-message.js';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
/** @type {import('./index.js').CartridgeUserConfig} */
const defaultConfig = {
  port: process.env.PORT ? Number(process.env.PORT) : 3002,
  stylesSheetsFolder: './.cartridge/ct-stylesheets',
  pagesFolder: './pages',
};

switch (args[0]) {
  case 'dev': {
    const config = getConfig();
    const { run } = await import('./library/main.dev.js');
    run(config);
    break;
  }
  case 'build': {
    buildProject();
    break;
  }
  case 'start': {
    const config = getConfig();
    const { run } = await import('./library/main.prod.js');
    run(config);
    break;
  }
  case '--help':
  case '-h':
  case undefined:
    showHelpAndExit();
    break;
  default:
    console.log(ErrorMessages.UNKNOWN_COMMAND.red.italic);
    process.exit(1);
}

/**
 * Shows the help message and exits the process.
 * @returns {never}
 */
function showHelpAndExit() {
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

/**
 * Gets the configuration from the command line arguments and cartridge.config.json.
 * @returns {import('./index.js').CartridgeUserConfig}
 */
function getConfig() {
  // Extract config from cartridge.config.json
  let config = {};
  if (existsSync('./cartridge.config.json')) {
    config = JSON.parse(readFileSync('./cartridge.config.json', 'utf-8'));
  }
  const currentConfig = { ...defaultConfig, ...config };

  // Extract port from command line arguments
  for (const arg of args) {
    if (arg.startsWith('--port=')) {
      currentConfig.port = Number(arg.split('=')[1]); // Get the port number
      if (
        !Number.isInteger(currentConfig.port) ||
        currentConfig.port < 1 ||
        currentConfig.port > 65535
      ) {
        console.log(ErrorMessages.INVALID_PORT_NUMBER.red.italic);
        process.exit(1);
      }
    }

    if (arg.startsWith('--base=')) {
      currentConfig.base = arg.split('=')[1];
    }

    if (arg.startsWith('--stylesSheetsFolder=')) {
      currentConfig.stylesSheetsFolder = arg.split('=')[1];
    }

    if (arg.startsWith('--pagesFolder=')) {
      currentConfig.pagesFolder = arg.split('=')[1];
    }
  }

  return currentConfig;
}

function buildProject() {
  const config = getConfig();
  console.log('Building client and server...'.blue.italic);
  writeFile(
    './main.js',
    `import { define } from '${config.pagesFolder}/routes.js';\ndefine();`
  )
    .then(() =>
      build({
        root: './',
        build: {
          outDir: 'dist/client',
        },
        plugins: [bullet()],
      })
    )
    .then(() =>
      build({
        root: './',
        build: {
          ssr: true,
          rollupOptions: {
            input: `${config.pagesFolder}/routes.js`,
          },
          outDir: 'dist/server',
        },
        plugins: [bullet()],
      })
    );
}
