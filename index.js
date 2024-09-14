/**
 * @typedef CartridgeUserConfig
 * @property {number} [port]
 * Port to run the server on.
 * @property {string} [base]
 * Base path for the application.
 * @property {string} [stylesSheetsFolder]
 * Folder to store the generated stylesheets. This is only valid when `persistStylesToDisk` is set to `true`.
 * @property {boolean} [persistStylesToDisk]
 * Whether to persist the generated stylesheets to disk, or store it in memory. Storing it in memory is faster for requests,
 * but the styles will be lost when the server is restarted.
 * @property {string} [pagesFolder]
 * Folder where the different pages in the application are stored.
 */

/**
 * Defines the configuration for Cartridge.
 *
 * @param {CartridgeUserConfig} userConfig - The user-defined configuration.
 * @returns {CartridgeUserConfig} The defined configuration.
 */
export function defineConfig(userConfig) {
  return userConfig;
}
