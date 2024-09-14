import { createServer } from 'vite';
import { bullet } from '@adbl/bullet/plugin';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { StyleSheets } from '../utils/stylesheets.js';
import { ErrorMessages } from './error-message.js';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Runs the application in development mode.
 * @param {import('../index.js').CartridgeUserConfig} config
 */
export async function run(config) {
  const app = express();
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base: config.base,
    plugins: [bullet()],
  });

  app.use(vite.middlewares);

  // Serve generated styles.
  const { styleBase, stylesheets } = StyleSheets.initialize(config);
  app.use(`${styleBase}/:id.css`, async (req, res) => {
    const params = /** @type {object} */ (req.params);
    const id = Reflect.get(params, 'id');
    const css = stylesheets.get(id);

    res.status(200).set({ 'Content-Type': 'text/css' }).send(css);
  });

  if (config.router === undefined) {
    console.error(ErrorMessages.NO_ROUTER_FILE.red.italic);
    throw new Error(ErrorMessages.NO_ROUTER_FILE);
  }
  const router = resolve(process.cwd(), config.router);
  writeFileSync('./main.js', `import { define } from '${router}'\n\ndefine();`);

  // Serve HTML
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl.replace(config.base ?? '/', '');
      const ssrManifest = undefined;

      if (!existsSync('./index.html')) {
        console.error(ErrorMessages.NO_INDEX_HTML.red.italic);
        throw new Error(ErrorMessages.NO_INDEX_HTML);
      }

      const template = await vite?.transformIndexHtml(
        url,
        await readFile('./index.html', 'utf-8')
      );
      const serverEntry = resolve(import.meta.dirname, './entry-server.js');
      const { render } = await vite.ssrLoadModule(serverEntry);

      const rendered = await render(url, ssrManifest, stylesheets, config);

      const html = template
        ?.replace('<!-- app-head -->', rendered.head ?? '')
        .replace(' <!-- app-html -->', rendered.html ?? '');

      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (e) {
      const error = /** @type {Error} */ (e);
      vite?.ssrFixStacktrace(error);
      console.log(error.stack);
      res.status(500).end(error.stack);
    }
  });

  app.listen({ port: config.port }, () => {
    console.clear();
    console.log('\nCartridge Dev Server started.'.grey);
    console.log(
      `Your application is running at ${
        'http://localhost:'.cyan + `${config.port}`.blue
      }`
    );
  });
}
