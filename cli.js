#!/usr/bin/env node

import { build } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { bullet } from '@adbl/bullet/plugin';
import { ErrorMessages } from './library/error-message.js';
import 'colors';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
/** @type {import('./index.js').CartridgeUserConfig} */
const defaultConfig = {
  port: process.env.PORT ? Number(process.env.PORT) : 3002,
  stylesSheetsFolder: './.cartridge/ct-stylesheets',
  router: './router/index.js',
  base: '/',
};

switch (args[0]) {
  case 'dev': {
    const config = await getConfig();
    const { run } = await import('./library/main.dev.js');
    run(config);
    break;
  }
  case 'build': {
    await buildProject();
    break;
  }
  case 'start': {
    const config = await getConfig();
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
 * @returns {Promise<import('./index.js').CartridgeUserConfig>}
 */
async function getConfig() {
  // Extract config from cartridge.config.json
  let config = {};
  if (existsSync('./cartridge.config.json')) {
    config = JSON.parse(readFileSync('./cartridge.config.json', 'utf-8'));
  } else if (existsSync('./cartridge.config.js')) {
    const address = resolve(process.cwd(), './cartridge.config.js');
    const imported = await import(address);
    if (imported.default) {
      config = imported.default;
    } else {
      console.error(ErrorMessages.NO_DEFAULT_EXPORT.red.italic);
    }
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

    if (arg.startsWith('--router=')) {
      currentConfig.router = arg.split('=')[1];
    }
  }

  return currentConfig;
}

async function buildProject() {
  const config = await getConfig();
  console.log('Building client and server...'.blue.italic);
  writeFile(
    './main.js',
    `import { define } from '${config.router}';\ndefine();`
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
            input: config.router,
          },
          outDir: 'dist/server',
        },
        plugins: [bullet()],
      })
    );
}
