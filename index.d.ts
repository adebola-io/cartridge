/**
 * Configuration for Cartridge.
 */
export interface CartridgeUserConfig {
  /**
   * Port to run the server on.
   */
  port?: number;
  /**
   * Base path for the application.
   */
  base?: string;
  /**
   * Folder to store the generated stylesheets. This is only valid when `persistStylesToDisk` is set to `true`.
   */
  stylesSheetsFolder?: string;
  /**
   * Whether to persist the generated stylesheets to disk, or store it in memory. Storing it in memory is faster for requests,
   * but the styles will be lost when the server is restarted.
   */
  persistStylesToDisk?: boolean;
  /**
   * Folder where the different pages in the application are stored.
   */
  router?: string;
  /**
   * This will inline create style tags for all components.
   * It is useful for faster rendering on the client,
   * but it will slow down the server rendering process and significantly increase the size of the HTML.
   */
  inlineAllComponentStyles?: boolean;
}

/**
 * Defines the configuration for Cartridge.
 * This function takes the user-defined configuration and returns it as is.
 * It does not modify the configuration in any way, only provides a type-safe interface.
 *
 * @param {CartridgeUserConfig} userConfig - The user-defined configuration.
 * @returns {CartridgeUserConfig} The defined configuration.
 */
export function defineConfig(
  userConfig: CartridgeUserConfig
): CartridgeUserConfig;
