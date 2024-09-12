import {
  cpSync,
  existsSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export async function preflight() {
  console.log('Preflighting...');
  const config = {
    port: process.env.PORT || 3002,
    stylesSheetsFolder: './.cartridge/ct-stylesheets',
    pagesFolder: './pages',
  };

  // Compare the config with the last config used to generate the project.
  // Regeneration is only needed if the config has changed.
  const configExists = existsSync('./cartridge.config.json');
  const oldConfigExists = existsSync('./.cartridge/cartridge.config.json');
  let noChange = false;
  if (configExists) {
    const newConfig = JSON.parse(
      readFileSync('./cartridge.config.json', 'utf-8')
    );

    if (oldConfigExists) {
      const oldConfig = JSON.parse(
        readFileSync('./.cartridge/cartridge.config.json', 'utf-8')
      );
      noChange = JSON.stringify(newConfig) === JSON.stringify(oldConfig);
    }

    if (newConfig.pagesFolder) {
      config.pagesFolder = path.resolve(process.cwd(), newConfig.pagesFolder);
    }
    if (newConfig.stylesSheetsFolder) {
      config.stylesSheetsFolder = path.resolve(
        process.cwd(),
        newConfig.stylesSheetsFolder
      );
    }
  } else if (oldConfigExists) {
    noChange = true;
  }

  const entryClientData = `
import { define } from '${path.resolve(
    process.cwd(),
    config.pagesFolder
  )}/routes.js';
define();
`;

  const entryServerData = `
import { Window } from 'happy-dom';
import { serialize } from './serialize.js';
import { setWindowContext } from '@adbl/bullet';

const window = new Window();
window.document.title = 'Cartridge';
setWindowContext(window, {
  initializeBulletComponent: true,
  addRouterWindowListeners: false,
  runConnectedCallbacks: false,
});

/**
 * @typedef RenderOutput
 * @property {string} html
 * @property {string} head
 */

const stylesheetsFolder = '${path.resolve(
    process.cwd(),
    config.stylesSheetsFolder
  )}';

/**
 * @param {string} url
 * @param {string | undefined} ssrManifest
 * @param {Map<string, string>} styleSheetsCache
 * @returns {Promise<RenderOutput>}
 */
export async function render(url, ssrManifest, styleSheetsCache) {
  const elementToStyleSourceMap = new Map();

  const { define } = await import('${path.resolve(
    process.cwd(),
    config.pagesFolder
  )}/routes.js');
  const router = define();
  const outlet = router.Outlet();

  router.connect(outlet, \`/\${url}\`);
  await router.rendering;

  const output = {
    html: '',
    head: \`<title>\${window.document.title}</title>\`,
    globalStyles: new Set(),
  };

  await serialize(
    outlet,
    output,
    window,
    elementToStyleSourceMap,
    styleSheetsCache,
    stylesheetsFolder
  );

  window.document.title = 'Cartridge';
  return output;
}

`;

  const rootFile = `
import { main } from './.cartridge/server.js';
main(${config.port}, \`${config.stylesSheetsFolder}\`); 
`;

  const folderExists = existsSync('./.cartridge');

  if (!folderExists || !noChange) {
    if (folderExists) {
      rmSync('./.cartridge', { recursive: true });
    }
    cpSync('./node_modules/@adbl/cartridge/template', './.cartridge', {
      recursive: true,
    });
    writeFileSync('./.cartridge/entry-client.js', entryClientData, 'utf-8');
    writeFileSync('./.cartridge/entry-server.js', entryServerData, 'utf-8');
    writeFileSync('./cartridge-start.js', rootFile, 'utf-8');
    writeFileSync(
      './.cartridge/cartridge.config.json',
      JSON.stringify(config),
      'utf-8'
    );
  }
}
