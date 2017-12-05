'use strict';

/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {ProjectOptions} = require('./project-options');
const {BowerBuilder} = require('./bower-builder');
const {ImportBuilder} = require('./import-builder');
const winston = require('winston');
const colors = require('colors/safe');
const path = require('path');
const fs = require('fs-extra');
const {DependendenciesManager} = require('api-console-dependency-manager');
/**
 * ARC components builder main class.
 * Performs the build of the components.
 */
class ArcComponentsProject {
  constructor(opts) {
    if (!(opts instanceof ProjectOptions)) {
      opts = new ProjectOptions(opts);
    }
    this.opts = opts;
    this.debugFileName = 'arc-components-builder.log';
    this.logger = this._setupLogger();
    if (!this.opts.isValid) {
      this.printValidationErrors();
      this.printValidationWarnings();
      throw new Error('Options did not passed validation.');
    }
    this.printValidationWarnings();

    // Working dir from which the command was executed.
    this.startDir = process.cwd();

    this.workingBuildOutput = '_arctmp';
    // final destination for the build.
    this.dest = this.opts.dest || './build';
  }

  _setupLogger() {
    if (this.opts.logger) {
      return this.opts.logger;
    }
    var level = this.opts.verbose ? 'debug' : 'error';
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: level}),
        new (winston.transports.File)({
          filename:  path.join(process.cwd(), this.debugFileName),
          level: level
        })
      ]
    });
  }

  printValidationErrors() {
    if (!this.opts.validationErrors) {
      return;
    }
    this.opts.validationErrors.forEach((error) => {
      this.logger.error(error);
    });
  }

  printValidationWarnings() {
    var warnings = this.opts.validationWarnings;
    if (!warnings || !warnings.length) {
      return;
    }
    warnings.forEach((warning) => {
      this.logger.warn(warning);
    });
  }

  /**
   * Builds the ARC components.
   * @return {Promise} Promise resolved when the build is ready
   */
  build() {
    return this._prepareBuild()
    .then(() => this._performBuild())
    .then(() => this._postBuild())
    .then(() => this.clearDebugFile())
    .catch((cause) => {
      this.logger.error('');
      this.logger.error(colors.red(cause.message));
      this.logger.error(colors.red(cause.stack));
      this.logger.error('');
      process.exit(1);
    });
  }

  /**
   * Contains all the tasks that have to be executed before running the builder.
   *
   * @return {Promise} Resolved promise when all pre-build work has been
   * completed.
   */
  _prepareBuild() {
    this.logger.info('Preparing build...');
    return this._createWorkingDir()
    .then(() => this._createBower())
    .then(() => this._installDependencies())
    .then(() => this._setupTheme())
    .then(() => this._createImport());
  }
  /**
   * Copies theme file to build location if defined in options.
   *
   * @return {Promise} Resolved promise if style option is not defined or the
   * file is copied.
   */
  _setupTheme() {
    if (!this.opts.style) {
      return Promise.resolve();
    }
    var fileName = path.basename(this.opts.style);
    var dest = path.join(this._buildLocation, fileName);
    return fs.copy(this.opts.style, dest);
  }

  /**
   * Performs a build of the ARC components.
   *
   * @return {Promise} Promise resolved when all operations finishes.
   */
  _performBuild() {
    var promise;
    if (this.opts.dev) {
      promise = Promise.resolve();
    } else {
      promise = this._buildPolymer();
    }
    return promise
    .then(() => {
      if (this.opts.react) {
        return this._reactThis();
      }
    });
  }
  /**
   * Performs post build tasks.
   *
   * @return {Promise} Promise resolved when all operations finishes.
   */
  _postBuild() {
    return this._copyToDestination()
    .then(() => this._clearUnusedFiles());
  }

  _copyToDestination() {
    return fs.remove(this.dest)
    .then(() => fs.move(this._buildLocation, this.dest));
  }

  _clearUnusedFiles() {
    return fs.remove(path.join(this.dest, 'package.json'))
    .then(() => fs.remove(path.join(this.dest, 'bower.json')))
    .then(() => fs.remove(path.join(this.dest, 'node_modules')))
    .then(() => {
      if (!this.opts.style) {
        return Promise.resolve();
      }
      let fileName = path.basename(this.opts.style);
      let dest = path.join(this._buildLocation, fileName);
      return fs.remove(dest);
    });
  }
  /**
   * Removes the debug log file on successfull build.
   * This is the last instruction in the build process so it something happen
   * before calling this function it will be noted in the debug file and
   * this comand will not be executed.
   *
   * @return {Promise} True when the file is removed.
   */
  clearDebugFile() {
    return fs.remove(this.debugFileName);
  }

  _createWorkingDir() {
    var location = path.join(this.startDir, this.workingBuildOutput);
    return fs.remove(location)
    .then(() => fs.ensureDir(location))
    .then(() => this._buildLocation = location);
  }
  // Generates a bower file to be used to install dependencies.
  _createBower() {
    const builder = new BowerBuilder(
      this._buildLocation,
      this.opts.arcComponents,
      this.opts.webComponents,
      this.logger
    );
    return builder.build();
  }

  _createImport() {
    const builder = new ImportBuilder(
      this._buildLocation,
      this.opts.arcComponents,
      this.opts.webComponents,
      this.opts.style,
      this.logger
    );
    return builder.build();
  }

  _installDependencies() {
    const opts = {};
    if (this.opts.verbose) {
      opts.verbose = true;
    }
    const manager = new DependendenciesManager(this._buildLocation, this.logger, opts);
    return manager.installDependencies();
  }

  _buildPolymer() {
    // This step is optional so `require` is inside a function and not global
    const {ArcComponentsBuilder} = require('./builder');
    const builder = new ArcComponentsBuilder(this._buildLocation, this.logger);
    return builder.build();
  }

  _reactThis() {
    this.logger.log('Generating React components');
    const opts = this._createReactorOptions();
    return require('wc-reactor')(opts);
  }

  _createReactorOptions() {
    const importFile = path.join(this._buildLocation, 'import.html');
    const opts = {
      webComponent: importFile,
      dest: this._buildLocation,
      logger: this.logger
    };
    if (this.opts.reactComponents) {
      opts.reactComponents = this.opts.reactComponents;
    }
    if (this.opts.bundleReactComponents) {
      opts.bundle = true;
      opts.bundleName = 'ArcComponents.js';
    }
    return opts;
  }
}

exports.ArcComponentsProject = ArcComponentsProject;
