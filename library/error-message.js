export const ErrorMessages = {
  INVALID_PORT_NUMBER:
    'Invalid port number. Port must be an integer between 1 and 65535.',

  INDEX_EXISTS: 'index.js already exists. This file will be overwritten.',

  NO_PAGES_FOLDER:
    'Folder for storing pages is not defined. Please create a cartridge.config.json file and set the pagesFolder property.',
  COULD_NOT_FIND_PAGES_FOLDER:
    'Could not find the pages folder. Please ensure that this folder exists.',
  UNKNOWN_COMMAND:
    'Unknown command. Please use cartridge --help to see the available commands.',
  NO_STYLESHEETS_FOLDER:
    'Folder for storing stylesheets is not defined. Please create a cartridge.config.json file and set the stylesSheetsFolder property.',
  NO_INDEX_HTML: 'Could not find the root index.html file.',
};
