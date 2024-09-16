import { readFile } from 'node:fs/promises';
import compression from 'compression';
import sirv from 'sirv';
import express from 'express';
import { StyleSheets } from '../utils/stylesheets.js';

/**
 * Runs the application in production mode.
 * @param {import('../index.js').CartridgeUserConfig} config
 */
export async function run(config) {
  const app = express();

  const ssrManifest = undefined;
  const template = await readFile('./dist/client/index.html', 'utf-8');
  const base = config.base ?? '/';

  app.use(compression());
  app.use(base, sirv('./dist/client', { extensions: [] }));

  const { styleBase, stylesheets } = StyleSheets.initialize(config);
  app.use(`${styleBase}/:id.css`, (req, res) => {
    const id = req.params.id;
    const css = stylesheets.get(id);

    res.status(200).set({ 'Content-Type': 'text/css' }).send(css);
  });

  // Serve HTML
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl.replace(config.base ?? '/', '');
      const { render } = await import('./entry-server.js');
      const rendered = await render(
        url,
        ssrManifest,
        stylesheets,
        config,
        true
      );

      const html = template
        ?.replace('<!-- app-head -->', rendered.head ?? '')
        .replace(' <!-- app-html -->', rendered.html ?? '');

      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (e) {
      const error = /** @type {Error} */ (e);
      console.log(error.stack);
      res.status(500).end(error.stack);
    }
  });

  app.listen({ port: config.port }, () => {
    console.clear();
    console.log('-- Cartridge Prod Server started'.blue.italic);
    console.log(
      `Your app is running successfully on port ${config.port}`.green.bold
    );
  });
}
