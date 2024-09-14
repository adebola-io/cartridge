import { Window } from 'happy-dom';
import { serialize } from './serialize.js';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { setWindowContext } from '@adbl/bullet';
import { ErrorMessages } from './error-message.js';

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

/**
 * @param {string} url
 * @param {string | undefined} ssrManifest
 * @param {{ get: (name: string) => string | undefined, set: (key: string, value: string) => void }} styleSheetsCache
 * @param {import('../index.js').CartridgeUserConfig} config
 * @returns {Promise<RenderOutput>}
 */
export async function render(
  url,
  ssrManifest,
  styleSheetsCache,
  config,
  isProduction = false
) {
  const elementToStyleSourceMap = new Map();
  let define;
  if (!isProduction) {
    if (config.pagesFolder === undefined) {
      console.error(ErrorMessages.NO_PAGES_FOLDER.red.italic);
      process.exit(1);
    }

    const pagesFolder = resolve(process.cwd(), config.pagesFolder);

    if (!existsSync(pagesFolder)) {
      console.error(ErrorMessages.COULD_NOT_FIND_PAGES_FOLDER.red.italic);
      process.exit(1);
    }

    define = (await import(join(pagesFolder, 'routes.js'))).define;
  } else {
    const address = resolve(process.cwd(), './dist/server/routes.js');
    define = (await import(address)).define;
  }

  const router = define();
  const outlet = router.Outlet();

  router.connect(outlet, `/${url}`);
  await router.rendering;

  const output = {
    html: '',
    head: `<title>${window.document.title}</title>`,
    globalStyles: new Set(),
  };

  await serialize(
    outlet,
    output,
    window,
    elementToStyleSourceMap,
    styleSheetsCache,
    config
  );

  window.document.title = 'Cartridge';
  return output;
}
