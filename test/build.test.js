'use strict';

const {ArcComponentsProject, ArcComponentsProjectOptions} = require('..');
const builder = require('../');
const assert = require('chai').assert;
const fs = require('fs-extra');

const logger = {
  log: function() {},
  warn: function() {},
  error: function() {},
  info: function() {}
};

const testBuildPath = 'test/build';

describe('Build test', function() {
  describe('Basics', function() {
    it('ArcComponentsProject is defined', function() {
      assert.ok(ArcComponentsProject);
    });
    it('ArcComponentsProjectOptions is defined', function() {
      assert.ok(ArcComponentsProjectOptions);
    });
    it('builder is defined', function() {
      assert.ok(builder);
    });
  });

  describe('Builds from export function', function() {
    this.timeout(20000);

    after(function() {
      return fs.remove(testBuildPath);
    });

    it('Should build for ARC element', function() {
      return builder({
        arcComponents: [
          'content-type-selector'
        ],
        verbose: false,
        react: false,
        logger: logger,
        dev: true,
        dest: testBuildPath
      });
    });

    it('Import file exists', function() {
      return fs.pathExists(testBuildPath + '/import.html')
      .then(exists => assert.isTrue(exists));
    });

    it('Bower components exists', function() {
      return fs.pathExists(testBuildPath + '/bower_components')
      .then(exists => assert.isTrue(exists));
    });

    it('Should build react component', function() {
      return builder({
        arcComponents: [
          'content-type-selector'
        ],
        verbose: false,
        react: true,
        reactComponents: ['content-type-selector'],
        logger: logger,
        dev: true,
        dest: testBuildPath
      });
    });

    it('Import file exists', function() {
      return fs.pathExists(testBuildPath + '/import.html')
      .then(exists => assert.isTrue(exists));
    });

    it('Helper file exists', function() {
      return fs.pathExists(testBuildPath + '/WebComponentsImports.js')
      .then(exists => assert.isTrue(exists));
    });

    it('React component exists', function() {
      return fs.pathExists(testBuildPath + '/ContentTypeSelector/ContentTypeSelector.js')
      .then(exists => assert.isTrue(exists));
    });

    it('Doesn\'t contain other React components', function() {
      return fs.readdir(testBuildPath)
      .then(items => {
        // import + helper + bower_components + react component
        assert.lengthOf(items, 4);
      });
    });

    it('Should build react components', function() {
      return builder({
        arcComponents: [
          'content-type-selector'
        ],
        verbose: false,
        react: true,
        logger: logger,
        dev: true,
        dest: testBuildPath
      });
    });

    it('Import file exists', function() {
      return fs.pathExists(testBuildPath + '/import.html')
      .then(exists => assert.isTrue(exists));
    });

    it('Helper file exists', function() {
      return fs.pathExists(testBuildPath + '/WebComponentsImports.js')
      .then(exists => assert.isTrue(exists));
    });

    it('Contains number of React components', function() {
      return fs.readdir(testBuildPath)
      .then(items => {
        assert.isAbove(items.length, 4);
      });
    });
  });

  describe('Builds from class export', function() {
    this.timeout(20000);

    after(function() {
      return fs.remove(testBuildPath);
    });

    it('Should build for ARC element', function() {
      const project = new ArcComponentsProject({
        arcComponents: [
          'content-type-selector'
        ],
        verbose: false,
        react: false,
        logger: logger,
        dev: false, // test for polymer builder
        dest: testBuildPath
      });
      return project.build();
    });

    it('Import file exists', function() {
      return fs.pathExists(testBuildPath + '/import.html')
      .then(exists => assert.isTrue(exists));
    });

    it('Bower components exists', function() {
      return fs.pathExists(testBuildPath + '/bower_components')
      .then(exists => assert.isTrue(exists));
    });
  });
});
