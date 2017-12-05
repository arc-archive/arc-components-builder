'use strict';

const {ArcComponentsProject} = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

const logger = {
  log: function() {},
  warn: function() {},
  error: function() {},
  info: function() {}
};

const testBuildPath = 'test/build';

describe('Project test', function() {

  const opts = {
    arcComponents: [
      'content-type-selector'
    ],
    react: true,
    reactComponents: ['content-type-selector'],
    verbose: false,
    dest: testBuildPath
  };

  describe('Constructor', function() {
    var project;
    before(function() {
      project = new ArcComponentsProject(opts);
    });

    it('Options object is created', function() {
      assert.equal(project.opts.constructor.name, 'ProjectOptions');
    });

    it('Debug file is defined', function() {
      assert.typeOf(project.debugFileName, 'string');
    });

    it('Default logger is constructed', function() {
      assert.typeOf(project.logger, 'object');
    });

    it('Defines "startDir" property', function() {
      assert.typeOf(project.startDir, 'string');
    });

    it('Defines "workingBuildOutput" property', function() {
      assert.typeOf(project.workingBuildOutput, 'string');
    });

    it('Defines "dest" property', function() {
      assert.equal(project.dest, testBuildPath);
    });
  });

  describe('_setupLogger()', function() {
    var project;
    before(function() {
      project = new ArcComponentsProject(opts);
    });

    it('Creates a default logger', function() {
      const result = project._setupLogger();
      assert.typeOf(result, 'object');
    });

    it('Returns logger from configuration options', function() {
      project.opts.logger = logger;
      const result = project._setupLogger();
      assert.isTrue(result === logger);
    });
  });

  describe('Build function', function() {
    it('_prepareBuild() calls required functions', function() {
      const project = new ArcComponentsProject(opts);
      var called = 0;
      project._createWorkingDir = () => {
        called++;
        return Promise.resolve();
      };
      project._createBower = () => {
        called++;
        return Promise.resolve();
      };
      project._installDependencies = () => {
        called++;
        return Promise.resolve();
      };
      project._createImport = () => {
        called++;
        return Promise.resolve();
      };
      return project._prepareBuild()
      .then(() => {
        assert.equal(called, 4);
      });
    });

    it('_performBuild() calls required functions', function() {
      const project = new ArcComponentsProject(opts);
      var called = 0;
      project._buildPolymer = () => {
        called++;
        return Promise.resolve();
      };
      project._reactThis = () => {
        called++;
        return Promise.resolve();
      };
      return project._performBuild()
      .then(() => {
        assert.equal(called, 2);
      });
    });

    it('_performBuild() calls polymer build only', function() {
      const project = new ArcComponentsProject(Object.assign({}, opts));
      project.opts.react = false;
      var called = 0;
      var polymerCalled = false;
      project._buildPolymer = () => {
        called++;
        polymerCalled = true;
        return Promise.resolve();
      };
      project._reactThis = () => {
        called++;
        return Promise.resolve();
      };
      return project._performBuild()
      .then(() => {
        assert.equal(called, 1);
        assert.isTrue(polymerCalled);
      });
    });

    it('_performBuild() calls react build only', function() {
      const project = new ArcComponentsProject(Object.assign({}, opts));
      project.opts.dev = true;
      var called = 0;
      var reactCalled = false;
      project._buildPolymer = () => {
        called++;
        return Promise.resolve();
      };
      project._reactThis = () => {
        called++;
        reactCalled = true;
        return Promise.resolve();
      };
      return project._performBuild()
      .then(() => {
        assert.equal(called, 1);
        assert.isTrue(reactCalled);
      });
    });

    it('_performBuild() does not call build functions', function() {
      const project = new ArcComponentsProject(Object.assign({}, opts));
      project.opts.dev = true;
      project.opts.react = false;
      var called = 0;
      project._buildPolymer = () => {
        called++;
        return Promise.resolve();
      };
      project._reactThis = () => {
        called++;
        return Promise.resolve();
      };
      return project._performBuild()
      .then(() => {
        assert.equal(called, 0);
      });
    });

    it('_postBuild() calls required functions', function() {
      const project = new ArcComponentsProject(Object.assign({}, opts));
      var called = 0;
      project._copyToDestination = () => {
        called++;
        return Promise.resolve();
      };
      project._clearUnusedFiles = () => {
        called++;
        return Promise.resolve();
      };
      return project._postBuild()
      .then(() => {
        assert.equal(called, 2);
      });
    });
  });

  describe('_clearUnusedFiles()', function() {
    before(function() {
      return fs.ensureFile(testBuildPath + '/package.json')
      .then(() => fs.ensureFile(testBuildPath + '/bower.json'))
      .then(() => fs.ensureFile(testBuildPath + '/import.html'))
      .then(() => fs.ensureFile(testBuildPath + '/node_modules/package.json'));
    });

    after(function() {
      return fs.remove(testBuildPath);
    });

    it('Clears redundant build files', function() {
      const project = new ArcComponentsProject(Object.assign({}, opts));
      return project._clearUnusedFiles();
    });

    it('package.json file has been cleared', function() {
      return fs.pathExists(testBuildPath + '/package.json')
      .then(exists => assert.isFalse(exists));
    });

    it('bower.json file has been cleared', function() {
      return fs.pathExists(testBuildPath + '/bower.json')
      .then(exists => assert.isFalse(exists));
    });

    it('node_modules dir has been cleared', function() {
      return fs.pathExists(testBuildPath + '/node_modules')
      .then(exists => assert.isFalse(exists));
    });

    it('import.html file is not cleared', function() {
      return fs.pathExists(testBuildPath + '/import.html')
      .then(exists => assert.isTrue(exists));
    });
  });

  describe('clearDebugFile()', function() {
    before(function() {
      return fs.ensureFile('arc-components-builder.log');
    });

    it('Clears debug file', function() {
      const project = new ArcComponentsProject(Object.assign({}, opts));
      return project.clearDebugFile();
    });

    it('Debug file is removed', function() {
      return fs.pathExists('arc-components-builder.log')
      .then(exists => assert.isFalse(exists));
    });
  });

  describe('_createWorkingDir()', function() {
    var project;
    before(function() {
      project = new ArcComponentsProject(Object.assign({}, opts));
      return fs.ensureFile('_arctmp/package.json');
    });

    it('Creates build dir', function() {

      return project._createWorkingDir();
    });

    it('Build location exists', function() {
      return fs.pathExists('_arctmp')
      .then(exists => assert.isTrue(exists));
    });

    it('Previous content has been removed', function() {
      return fs.pathExists('_arctmp/package.json')
      .then(exists => assert.isFalse(exists));
    });

    it('Sets _buildLocation property', function() {
      assert.typeOf(project._buildLocation, 'string');
    });
  });

  describe('_createReactorOptions()', function() {
    var project;
    before(function() {
      project = new ArcComponentsProject(Object.assign({}, opts));
      project.logger = logger;
      project._buildLocation = 'TEST';
    });

    it('Creates an object', function() {
      const result = project._createReactorOptions();
      assert.typeOf(result, 'object');
    });

    it('Sets webComponent property', function() {
      const result = project._createReactorOptions();
      assert.equal(result.webComponent, 'TEST/import.html');
    });

    it('Sets "dest" property', function() {
      const result = project._createReactorOptions();
      assert.equal(result.dest, 'TEST');
    });

    it('Sets "logger" property', function() {
      const result = project._createReactorOptions();
      assert.isTrue(result.logger === logger);
    });

    it('Sets "reactComponents" property', function() {
      const result = project._createReactorOptions();
      assert.typeOf(result.reactComponents, 'array');
    });

    it('"bundle" is not set', function() {
      const result = project._createReactorOptions();
      assert.isUndefined(result.bundle);
    });

    it('"bundleName" is not set', function() {
      const result = project._createReactorOptions();
      assert.isUndefined(result.bundleName);
    });

    it('Sets "bundle" property', function() {
      project.opts.bundleReactComponents = true;
      const result = project._createReactorOptions();
      assert.isTrue(result.bundle);
    });

    it('"bundleName" is not set', function() {
      project.opts.bundleReactComponents = true;
      const result = project._createReactorOptions();
      assert.equal(result.bundleName, 'ArcComponents.js');
    });
  });
});
