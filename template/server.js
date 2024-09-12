import fs from 'node:fs/promises';
import express from 'express';
import config from './config.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * @param {number} port
 * @param {string} stylesFolder
 */
export async function main(port, stylesFolder) {
  // Cached production assets
  const templateHtml = config.isProduction
    ? await fs.readFile('./dist/client/index.html', 'utf-8')
    : '';
  const ssrManifest = undefined;

  // Create http server
  const app = express();

  // Add Vite or respective production middlewares
  /** @type {import('vite').ViteDevServer | null} */
  let vite = null;
  if (!config.isProduction) {
    const { createServer } = await import('vite');
    const { bullet } = await import('@adbl/bullet/plugin');
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
      base: config.base,
      plugins: [bullet()],
    });
    app.use(vite.middlewares);
  } else {
    const compression = (await import('compression')).default;
    const sirv = (await import('sirv')).default;
    // @ts-ignore
    app.use(compression());
    app.use(config.base, sirv('./dist/client', { extensions: [] }));
  }

  const styleBase = stylesFolder.split('/').at(-1);
  /** @type {{ get: (name: string) => string | undefined, set: (key: string, value: string) => void }} */
  const styleSheets = {
    get: (key) => {
      if (!existsSync(`${stylesFolder}/${key}.css`)) {
        return undefined;
      }
      return readFileSync(`${stylesFolder}/${key}.css`, 'utf-8').toString();
    },
    set: (key, value) => {
      if (!existsSync(stylesFolder)) {
        mkdirSync(stylesFolder, { recursive: true });
      }
      writeFileSync(`${stylesFolder}/${key}.css`, value);
    },
  };

  if (styleBase) {
    app.use(`/${styleBase}/:id.css`, async (req, res) => {
      const id = req.params.id;
      const css = styleSheets.get(id);

      res.status(200).set({ 'Content-Type': 'text/css' }).send(css);
    });
  }

  // Serve HTML
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl.replace(config.base, '');

      let template;
      let render;
      if (!config.isProduction) {
        // Always read fresh template in development
        template = await fs.readFile('./index.html', 'utf-8');
        template = await vite?.transformIndexHtml(url, template);
        render = (await vite?.ssrLoadModule('./.cartridge/entry-server.js'))
          ?.render;
      } else {
        template = templateHtml;
        // @ts-ignore
        render = (await import('./entry-server.js')).render;
      }

      const rendered = await render(url, ssrManifest, styleSheets);

      const html = template
        ?.replace('<!--app-head-->', rendered.head ?? '')
        .replace('<!--app-html-->', rendered.html ?? '');

      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (e) {
      const error = /** @type {Error} */ (e);
      vite?.ssrFixStacktrace(error);
      console.log(error.stack);
      res.status(500).end(error.stack);
    }
  });

  // Start http server
  app.listen(port, () => {
    console.clear();
    console.log(`-- Cartridge Server started at http://localhost:${port}`);
  });
}
