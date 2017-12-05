'use strict';

const {ImportBuilder} = require('../lib/import-builder');
const assert = require('chai').assert;
const fs = require('fs-extra');

const logger = {
  log: function() {},
  warn: function() {},
  error: function() {},
  info: function() {}
};

const testBuildPath = 'test/build/import';
const testBuildPathRemove = 'test/build';
const testBuildFile = 'test/build/import/import.html';

describe('Import builder test', function() {
  it('Has import file name defined', function() {
    var builder = new ImportBuilder();
    assert.equal(builder.importFile, 'import.html');
  });

  describe('_nameFromDependency()', function() {
    var builder;
    before(function() {
      builder = new ImportBuilder();
    });

    it('Should return name for name', function() {
      const name = 'test-web-component';
      const result = builder._nameFromDependency(name);
      assert.equal(result, name);
    });

    it('Should return name for a name with path', function() {
      const name = 'PolymerElements/test-web-component';
      const result = builder._nameFromDependency(name);
      assert.equal(result, 'test-web-component');
    });

    it('Should return name for an URL', function() {
      const name = 'https://github.com/PolymerElements/test-web-component';
      const result = builder._nameFromDependency(name);
      assert.equal(result, 'test-web-component');
    });

    it('Should return name for a name with version', function() {
      var name = 'test-web-component#1';
      var result = builder._nameFromDependency(name);
      assert.equal(result, 'test-web-component');

      name = 'test-web-component#^1.0.0';
      result = builder._nameFromDependency(name);
      assert.equal(result, 'test-web-component');
    });

    it('Should return name for a name with url', function() {
      var name = 'https://github.com/PolymerElements/test-web-component#1';
      var result = builder._nameFromDependency(name);
      assert.equal(result, 'test-web-component');

      name = 'https://github.com/PolymerElements/test-web-component#^1.0.0';
      result = builder._nameFromDependency(name);
      assert.equal(result, 'test-web-component');
    });
  });

  describe('_prepareDependencies()', function() {
    var builder;
    var deps;
    before(function() {
      deps = [
        'raml-request-panel',
        'advanced-rest-client/paper-autocomplete',
        'paper-fab#1.0.0',
        'PolymerElements/paper-input#^1.0.0'
      ];
      builder = new ImportBuilder('', deps);
    });

    it('Return an object', function() {
      const result = builder._prepareDependencies(deps);
      assert.typeOf(result, 'array');
    });

    it('Result has 4 items', function() {
      const result = builder._prepareDependencies(deps);
      assert.lengthOf(result, 4);
    });

    it('List items has valid values', function() {
      const result = builder._prepareDependencies(deps);
      assert.equal(result[0], 'bower_components/raml-request-panel/raml-request-panel.html');
      assert.equal(result[1], 'bower_components/paper-autocomplete/paper-autocomplete.html');
      assert.equal(result[2], 'bower_components/paper-fab/paper-fab.html');
      assert.equal(result[3], 'bower_components/paper-input/paper-input.html');
    });
  });

  describe('importContent()', function() {
    var webDeps;
    var arcDeps;
    before(function() {
      webDeps = [
        'raml-request-panel',
        'advanced-rest-client/paper-autocomplete',
        'PolymerElements/paper-fab#1.0.0',
        'PolymerElements/paper-input#^1.0.0'
      ];
      arcDeps = [
        'raml-other-panel',
        'advanced-rest-client/paper-combobox',
        'paper-fabric#1.0.0'
      ];
    });

    it('Should return a string', function() {
      const builder = new ImportBuilder('', arcDeps, webDeps, logger);
      const result = builder.importContent();
      assert.typeOf(result, 'string');
    });

    it('Has import definitions', function() {
      const builder = new ImportBuilder('', arcDeps, webDeps, logger);
      const result = builder.importContent();
      const parts = result.split('\n');
      assert.lengthOf(parts, 9); // empty line at the end
    });

    it('Contains polymer import', function() {
      const builder = new ImportBuilder('', arcDeps, webDeps, logger);
      const result = builder.importContent();
      const parts = result.split('\n');
      assert.isTrue(parts[0].indexOf('polymer.html') !== -1);
    });

    it('Has dependencies for ARC only', function() {
      const builder = new ImportBuilder('', arcDeps, undefined, logger);
      const result = builder.importContent();
      const parts = result.split('\n');
      assert.lengthOf(parts, 5);
    });

    it('Has dependencies for WC only', function() {
      const builder = new ImportBuilder('', undefined, webDeps, logger);
      const result = builder.importContent();
      const parts = result.split('\n');
      assert.lengthOf(parts, 6);
    });
  });

  describe('saveContent()', function() {
    var builder;
    before(function() {
      var webDeps = [
        'raml-request-panel',
        'advanced-rest-client/paper-autocomplete',
        'PolymerElements/paper-fab#1.0.0',
        'PolymerElements/paper-input#^1.0.0'
      ];
      var arcDeps = [
        'raml-other-panel',
        'advanced-rest-client/paper-combobox',
        'paper-fabric#1.0.0'
      ];
      builder = new ImportBuilder(testBuildPath, arcDeps, webDeps, logger);
    });

    after(function() {
      return fs.remove(testBuildPathRemove);
    });

    it('Should create a file', function() {
      var content = 'TEST';
      return builder.saveContent(content)
      .then(() => {
        return fs.pathExists(testBuildFile);
      })
      .then(exists => assert.isTrue(exists));
    });

    it('Created file is not empty', function() {
      return fs.readFile(testBuildFile, 'utf8')
      .then(result => assert.typeOf(result, 'string'));
    });

    it('File contains the content', function() {
      return fs.readFile(testBuildFile, 'utf8')
      .then(result => assert.equal(result, 'TEST'));
    });
  });

  describe('build()', function() {
    var builder;
    before(function() {
      var webDeps = [
        'raml-request-panel',
        'advanced-rest-client/paper-autocomplete',
        'PolymerElements/paper-fab#1.0.0',
        'PolymerElements/paper-input#^1.0.0'
      ];
      var arcDeps = [
        'raml-other-panel',
        'advanced-rest-client/paper-combobox',
        'paper-fabric#1.0.0'
      ];
      builder = new ImportBuilder(testBuildPath, arcDeps, webDeps, logger);
    });

    after(function() {
      return fs.remove(testBuildPathRemove);
    });

    it('Should create a file', function() {
      return builder.build()
      .then(() => {
        return fs.pathExists(testBuildFile);
      })
      .then(exists => assert.isTrue(exists));
    });

    it('Created file is not empty', function() {
      return fs.readFile(testBuildFile, 'utf8')
      .then(result => assert.typeOf(result, 'string'));
    });

    it('File contains import definition', function() {
      return fs.readFile(testBuildFile, 'utf8')
      .then(result => {
        const parts = result.split('\n');
        assert.lengthOf(parts, 9);
      });
    });
  });
});
