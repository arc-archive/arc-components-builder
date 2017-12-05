'use strict';

const {BowerBuilder} = require('../lib/bower-builder');
const assert = require('chai').assert;
const fs = require('fs-extra');

const logger = {
  log: function() {},
  warn: function() {},
  error: function() {},
  info: function() {}
};

const testBuildPath = 'test/build/bower';
const testBuildPathRemove = 'test/build';
const testBuildFile = 'test/build/bower/bower.json';

describe('Bower builder test', function() {

  it('Has bower file name defined', function() {
    var builder = new BowerBuilder();
    assert.equal(builder.bowerFile, 'bower.json');
  });

  describe('_nameFromDependency()', function() {
    var builder;
    before(function() {
      builder = new BowerBuilder();
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

  describe('_prepareArcDependencies()', function() {
    var builder;
    before(function() {
      var deps = [
        'raml-request-panel',
        'advanced-rest-client/paper-autocomplete',
        'paper-fab#1.0.0',
        'PolymerElements/paper-input#^1.0.0'
      ];
      builder = new BowerBuilder('', deps);
    });

    it('Return an object', function() {
      const result = builder._prepareArcDependencies();
      assert.typeOf(result, 'object');
    });

    it('Result has 4 items', function() {
      const result = builder._prepareArcDependencies();
      assert.lengthOf(Object.keys(result), 4);
    });

    it('Map items has valid keys', function() {
      const result = builder._prepareArcDependencies();
      assert.ok(result['raml-request-panel']);
      assert.ok(result['paper-autocomplete']);
      assert.ok(result['paper-fab']);
      assert.ok(result['paper-input']);
    });

    it('Map items has valid values', function() {
      const result = builder._prepareArcDependencies();
      assert.equal(result['raml-request-panel'], 'advanced-rest-client/raml-request-panel');
      assert.equal(result['paper-autocomplete'], 'advanced-rest-client/paper-autocomplete');
      assert.equal(result['paper-fab'], 'advanced-rest-client/paper-fab#1.0.0');
      assert.equal(result['paper-input'], 'PolymerElements/paper-input#^1.0.0');
    });
  });

  describe('_prepareExtraDependencies()', function() {
    var builder;
    before(function() {
      var deps = [
        'raml-request-panel',
        'advanced-rest-client/paper-autocomplete',
        'PolymerElements/paper-fab#1.0.0',
        'PolymerElements/paper-input#^1.0.0'
      ];
      builder = new BowerBuilder('', [], deps);
    });

    it('Return an object', function() {
      const result = builder._prepareExtraDependencies();
      assert.typeOf(result, 'object');
    });

    it('Result has 4 items', function() {
      const result = builder._prepareExtraDependencies();
      assert.lengthOf(Object.keys(result), 4);
    });

    it('Map items has valid keys', function() {
      const result = builder._prepareExtraDependencies();
      assert.ok(result['raml-request-panel']);
      assert.ok(result['paper-autocomplete']);
      assert.ok(result['paper-fab']);
      assert.ok(result['paper-input']);
    });

    it('Map items has valid values', function() {
      const result = builder._prepareExtraDependencies();
      assert.equal(result['raml-request-panel'], 'raml-request-panel');
      assert.equal(result['paper-autocomplete'], 'advanced-rest-client/paper-autocomplete');
      assert.equal(result['paper-fab'], 'PolymerElements/paper-fab#1.0.0');
      assert.equal(result['paper-input'], 'PolymerElements/paper-input#^1.0.0');
    });
  });

  describe('bowerContent()', function() {
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

    it('Should build bower object', function() {
      const builder = new BowerBuilder('', arcDeps, webDeps, logger);
      const result = builder.bowerContent();
      assert.typeOf(result, 'object');
      assert.typeOf(result.name, 'string');
      assert.typeOf(result.version, 'string');
      assert.typeOf(result.main, 'string');
    });

    it('Has dependencies definitions', function() {
      const builder = new BowerBuilder('', arcDeps, webDeps, logger);
      const result = builder.bowerContent();
      assert.typeOf(result.dependencies, 'object');
      assert.lengthOf(Object.keys(result.dependencies), 7);
    });

    it('Has dependencies for ARC only', function() {
      const builder = new BowerBuilder('', arcDeps, undefined, logger);
      const result = builder.bowerContent();
      assert.typeOf(result.dependencies, 'object');
      assert.lengthOf(Object.keys(result.dependencies), 3);
    });

    it('Has dependencies for WC only', function() {
      const builder = new BowerBuilder('', undefined, webDeps, logger);
      const result = builder.bowerContent();
      assert.typeOf(result.dependencies, 'object');
      assert.lengthOf(Object.keys(result.dependencies), 4);
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
      builder = new BowerBuilder(testBuildPath, arcDeps, webDeps, logger);
    });

    after(function() {
      return fs.remove(testBuildPathRemove);
    });

    it('Should create a file', function() {
      var content = {test: 'true'};
      return builder.saveContent(content)
      .then(() => {
        return fs.pathExists(testBuildFile);
      })
      .then(exists => assert.isTrue(exists));
    });

    it('Created file is not empty', function() {
      return fs.readJson(testBuildFile)
      .then(result => assert.typeOf(result, 'object'));
    });

    it('File contains the content', function() {
      return fs.readJson(testBuildFile)
      .then(result => assert.equal(result.test, 'true'));
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
      builder = new BowerBuilder(testBuildPath, arcDeps, webDeps, logger);
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
      return fs.readJson(testBuildFile)
      .then(result => assert.typeOf(result, 'object'));
    });

    it('File contains bower definition', function() {
      return fs.readJson(testBuildFile)
      .then(result => {
        assert.typeOf(result, 'object');
        assert.typeOf(result.name, 'string');
        assert.typeOf(result.version, 'string');
        assert.typeOf(result.main, 'string');
        assert.typeOf(result.dependencies, 'object');
        assert.lengthOf(Object.keys(result.dependencies), 7);
      });
    });
  });
});
