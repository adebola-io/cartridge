export const ErrorMessages = {
  INVALID_PORT_NUMBER:
    'Invalid port number. Port must be an integer between 1 and 65535.',

  INDEX_EXISTS: 'index.js already exists. This file will be overwritten.',
  NO_DEFAULT_EXPORT:
    'The cartridge.config.js file must export a default object.',

  NO_ROUTER_FILE:
    'Folder for storing pages is not defined. Please create a cartridge.config.json file and set the router property.',
  COULD_NOT_FIND_ROUTER_FILE:
    'Could not find the pages folder. Please ensure that this folder exists.',
  UNKNOWN_COMMAND:
    'Unknown command. Please use cartridge --help to see the available commands.',
  NO_STYLESHEETS_FOLDER:
    'Folder for storing stylesheets is not defined. Please create a cartridge.config.json file and set the stylesSheetsFolder property.',
  NO_INDEX_HTML: 'Could not find the root index.html file.',
};
