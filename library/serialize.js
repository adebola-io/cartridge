/**
 * Recursively converts the DOM tree of an element and its children to a declarative Shadow DOM structure.
 *
 * @param {Node} node
 * The root element to convert to declarative Shadow DOM.
 * @param {{ html: string, globalStyles: Set<CSSStyleSheet>, head: string }} output
 * The output object to store the serialized DOM tree.
 * @param {object} windowContext
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
  const window = /** @type {import('@adbl/bullet/shim').WindowContext} */ (
    windowContext
  );

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
    output.html += `<${tagName}`;
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
        const shadowDomStyles = Array.from(node.shadowRoot.adoptedStyleSheets);
        const list = [];
        let i = 0;
        for (const style of shadowDomStyles) {
          if (style.cssRules.length === 0) continue;

          // Stylesheet has already been processed.
          if (Reflect.has(style, 'bullet__name')) {
            const name = Reflect.get(style, 'bullet__name');
            list.push(`${name}.css`);
            continue;
          }

          const name = generateStyleSheetId(style, node.tagName, i++);
          Reflect.set(style, 'bullet__name', name);
          const file = `${name}.css`;
          const string = convertCSSStyleSheetToString(style);

          styleSheetsCache.set(name, string);

          list.push(file);
        }

        styleSourceMap.set(node.tagName, list);
      }

      for (const sourceString of styleSourceMap.get(node.tagName) ?? []) {
        const base = config.stylesSheetsFolder?.split('/').at(-1);
        const href = base ? `/${base}/${sourceString}` : `/${sourceString}`;
        // Stylesheets that are shared across elements will always be linked.
        // An element can also decide to inline styles.
        const shouldInlineStyles =
          Reflect.get(node, 'bullet__inlineStyles') === true ||
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
            output.head += `<style data-associated-tag-name="${tag}">${string}</style>`;
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
 * @param {CSSStyleSheet} stylesheet
 * @param {string} tagName
 * @param {number} id
 * @returns {string}
 */
export function generateStyleSheetId(stylesheet, tagName, id) {
  const isShared = Reflect.get(stylesheet, 'bullet__shared') === true;
  if (isShared) {
    return `shared-${id}`;
  }
  return `bullet-${tagName.toLowerCase()}-${id}`;
}
