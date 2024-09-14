import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ErrorMessages } from '../library/error-message.js';

export class StyleSheets {
  /**
   *
   * @param {string} path
   */
  constructor(path) {
    this.path = path;
  }

  /**
   * @param {string} key
   */
  get(key) {
    if (!existsSync(`${this.path}/${key}.css`)) {
      return undefined;
    }
    return readFileSync(`${this.path}/${key}.css`, 'utf-8').toString();
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  set(key, value) {
    if (!existsSync(this.path)) {
      mkdirSync(this.path, { recursive: true });
    }
    writeFileSync(`${this.path}/${key}.css`, value);
    return this;
  }

  /**
   * Creates the stylesheet object.
   * @param {import('../index.js').CartridgeUserConfig} config
   * @returns {{ styleBase: string, stylesheets: StyleSheets | Map<string, string> }}
   */
  static initialize(config) {
    const styleBase = config.stylesSheetsFolder?.split('/').at(-1);

    let stylesheets;
    if (config.persistStylesToDisk) {
      if (config.stylesSheetsFolder === undefined) {
        console.error(ErrorMessages.NO_STYLESHEETS_FOLDER.red.italic);
        process.exit(1);
      }
      stylesheets = new StyleSheets(config.stylesSheetsFolder);
    } else {
      stylesheets = new Map();
    }

    return { styleBase: styleBase ? `/${styleBase}` : '', stylesheets };
  }
}
