import { CSSText } from '@adbl/bullet';

/**
 * Recursively converts the DOM tree of an element and its children to a declarative Shadow DOM structure.
 *
 * @param {import('happy-dom').Node} node
 * The root element to convert to declarative Shadow DOM.
 * @param {{ html: string, globalStyles: Set<CSSStyleSheet>, head: string }} output
 * The output object to store the serialized DOM tree.
 * @param {import('happy-dom').Window} windowContext
 * The window object.
 * @param {Map<string, string[]>} styleSourceMap
 * Utility Data structure to match the stylesheet to the tag name.
 * @param {{ get: (name: string) => string | undefined, set: (key: string, value: string) => void }} styleSheetsCache
 * Utility Data structure to retrieve generated stylesheets.
 * @param {import('../index.js').CartridgeUserConfig} config
 * Passed in configuration for where stylesheets should be stored as they are generated.
 */
export async function serialize(
  node,
  output,
  windowContext,
  styleSourceMap,
  styleSheetsCache,
  config
) {
  const window = windowContext;

  if (node instanceof window.Text || node.nodeType === 3) {
    output.html += node.textContent;
    return;
  }

  if (node instanceof window.DocumentFragment || node.nodeType === 11) {
    for (const childNode of node.childNodes) {
      await serialize(
        childNode,
        output,
        window,
        styleSourceMap,
        styleSheetsCache,
        config
      );
    }
    return;
  }

  if (node instanceof window.Comment || node.nodeType === 8) {
    output.html += `<!--${node.textContent}-->`;
    return;
  }

  if (node instanceof window.ProcessingInstruction || node.nodeType === 7) {
    const target = Reflect.get(node, 'bullet__target');
    const data = Reflect.get(node, 'bullet__data');
    output.html += `<?${target} ${data}>`;
    return;
  }

  if (node instanceof window.Element) {
    const tagName = node.tagName.toLowerCase();
    output.html += `<${tagName} ct-static`;
    for (const attr of node.attributes) {
      output.html += ` ${attr.name}="${attr.value}"`;
    }
    output.html += '>';

    // Append shadow root.
    if (node.shadowRoot) {
      const mode = node.shadowRoot.mode;
      output.html += `<template ct-node tag="${tagName}" shadowrootmode="${mode}">`;

      // Append styles.
      if (!styleSourceMap.has(node.tagName)) {
        /** @type {CSSText[] | undefined} */
        const styleTexts = Reflect.get(node, 'bullet__cssTextArray');
        const list = [];
        let i = 0;
        if (styleTexts) {
          for (const cssText of styleTexts) {
            if (!cssText.raw) continue;

            // Stylesheet has already been processed.
            if (Reflect.has(cssText, 'bullet__name')) {
              const name = Reflect.get(cssText, 'bullet__name');
              list.push(`${name}.css`);
              continue;
            }

            // Marks the stylesheet as visited.
            const name = generateStyleSheetId(cssText, node.tagName, i++);
            Reflect.set(cssText, 'bullet__name', name);
            const file = `${name}.css`;

            styleSheetsCache.set(name, cssText.raw.replace(/\n/g, ''));

            list.push(file);
          }
        }

        styleSourceMap.set(node.tagName, list);
      }

      for (const sourceString of styleSourceMap.get(node.tagName) ?? []) {
        const base = config.stylesSheetsFolder?.split('/').at(-1);
        const href = base ? `/${base}/${sourceString}` : `/${sourceString}`;
        // Stylesheets that are shared across elements will always be linked.
        // An element can also decide to inline styles.
        const shouldInlineStyles =
          Reflect.get(node, 'bullet__inlineStyles') ||
          config.inlineAllComponentStyles;
        if (shouldInlineStyles && !sourceString.startsWith('shared-')) {
          const key = sourceString?.split('.')[0];
          const data = styleSheetsCache.get(key);
          output.html += `<style ct-node>${data}</style>`;
        } else {
          output.html += `<link ct-node rel="stylesheet" href="${href}">`;
        }
      }

      // Append shadow root children.
      const childNodes = Array.from(node.shadowRoot.childNodes);
      for (const childNode of childNodes) {
        await serialize(
          childNode,
          output,
          window,
          styleSourceMap,
          styleSheetsCache,
          config
        );
      }

      output.html += '</template>';

      // Append Global Styles to the head.
      /** @type {(CSSStyleSheet | Promise<CSSStyleSheet>)[]} */
      const stylesheetArray = Reflect.get(
        node,
        'bullet__associatedGlobalStyles'
      );

      if (stylesheetArray) {
        for (const stylesheet of stylesheetArray) {
          try {
            const sheet = await stylesheet;
            if (output.globalStyles.has(sheet)) {
              continue;
            }
            output.globalStyles.add(sheet);
            const tag = tagName.toLowerCase();
            const string = convertCSSStyleSheetToString(sheet);
            output.head += `<style ct-node data-associated-tag-name="${tag}">${string}</style>`;
          } catch (error) {
            console.error(error);
          }
        }
      }
    }

    for (const childNode of node.childNodes) {
      await serialize(
        childNode,
        output,
        window,
        styleSourceMap,
        styleSheetsCache,
        config
      );
    }

    output.html += `</${node.tagName.toLowerCase()}>`;
  }
}

/**
 * @param {CSSStyleSheet} styleSheet
 * @returns {string}
 */
export function convertCSSStyleSheetToString(styleSheet) {
  const cssText = Array.from(styleSheet.cssRules)
    .map((rule) => rule.cssText)
    .join('\n');
  return cssText;
}

/**
 * Generates a marker for a stylesheet.
 * @param {CSSText} cssText
 * @param {string} tagName
 * @param {number} id
 * @returns {string}
 */
export function generateStyleSheetId(cssText, tagName, id) {
  const isShared = Reflect.get(cssText, 'bullet__shared') === true;
  if (isShared) {
    return `shared-${id}`;
  }
  return `bullet-${tagName.toLowerCase()}-${id}`;
}
