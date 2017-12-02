const builder = require('../');
builder({
  arcComponents: [
    'content-type-selector',
    'paper-combobox',
    'headers-editor',
    'http-method-selector',
    'url-input-editor'
  ],
  verbose: true,
  react: true,
  logger: console,
  reactComponents: ['url-input-editor'],
  dev: true
});
