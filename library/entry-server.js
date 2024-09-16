import { serialize } from './serialize.js';
import { ErrorMessages } from './error-message.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { setWindowContext } from '@adbl/bullet';
import { Window } from 'happy-dom';
import process from 'node:process';

const window = new Window();
window.document.title = 'Cartridge';

setWindowContext(window, {
  initializeBulletComponent: true,
  addRouterWindowListeners: false,
  runConnectedCallbacks: false,
  isServerMode: true,
});

/**
 * @typedef RenderOutput
 * @property {string} html
 * @property {string} head
 */

/**
 * @param {string} url
 * @param {string | undefined} _ssrManifest
 * @param {{ get: (name: string) => string | undefined, set: (key: string, value: string) => void }} styleSheetsCache
 * @param {import('../index.js').CartridgeUserConfig} config
 * @returns {Promise<RenderOutput>}
 */
export async function render(
  url,
  _ssrManifest,
  styleSheetsCache,
  config,
  isProduction = false
) {
  const elementToStyleSourceMap = new Map();
  let define;
  if (!isProduction) {
    if (config.router === undefined) {
      console.error(ErrorMessages.NO_ROUTER_FILE.red.italic);
      process.exit(1);
    }

    const router = resolve(process.cwd(), config.router);

    if (!existsSync(router)) {
      console.error(ErrorMessages.COULD_NOT_FIND_ROUTER_FILE.red.italic);
      process.exit(1);
    }

    define = (await import(/* @vite-ignore */ router)).define;
  } else {
    const address = resolve(process.cwd(), './dist/server/index.js');
    define = (await import(/* @vite-ignore */ address)).define;
  }

  const router = define();
  const outlet = router.Outlet();

  await router.connect(outlet, `/${url}`);

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
