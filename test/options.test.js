'use strict';

const {ProjectOptions} = require('../lib/project-options');
const assert = require('chai').assert;

describe('Options test', () => {

  it('Sets error for unknown option', function() {
    const instance = new ProjectOptions({
      arcComponents: ['test'],
      unknownOption: true
    });

    assert.isFalse(instance.isValid, 'isValid is false');
    assert.lengthOf(instance.validationErrors, 1, 'Errors list contains message');
  });

  it('Sets error for missing components list', function() {
    const instance = new ProjectOptions({});

    assert.isFalse(instance.isValid, 'isValid is false');
    assert.lengthOf(instance.validationErrors, 1, 'Errors list contains message');
  });

  it('Sets error for invalid option type', function() {
    const instance = new ProjectOptions({
      arcComponents: 'test',
      webComponents: 'test',
      style: true,
      dev: 'true',
      react: 'true',
      reactComponents: {},
      verbose: '0',
      logger: true,
      dest: 1234
    });

    assert.isFalse(instance.isValid, 'isValid is false');
    assert.lengthOf(instance.validationErrors, 9, 'Errors list contains message');
  });

  it('Sets warning for invalid logger', function() {
    const instance = new ProjectOptions({
      arcComponents: ['test'],
      logger: {}
    });

    assert.isTrue(instance.isValid, 'isValid is true');
    assert.lengthOf(instance.validationErrors, 0, 'Errors list is empty');
    assert.lengthOf(instance.validationWarnings, 1, 'Warning list conatins an item');
  });

  it('Invalid logger is removed', function() {
    const instance = new ProjectOptions({
      arcComponents: ['test'],
      logger: {}
    });

    assert.isUndefined(instance.logger);
  });

  it('Sets error for invalid logger', function() {
    const instance = new ProjectOptions({
      arcComponents: ['test'],
      reactComponents: ['hello']
    });

    assert.isTrue(instance.isValid, 'isValid is true');
    assert.lengthOf(instance.validationErrors, 0, 'Errors list is empty');
    assert.lengthOf(instance.validationWarnings, 1, 'Warning list conatins an item');
  });
});
