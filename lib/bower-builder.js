'use strict';

/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const path = require('path');
const fs = require('fs-extra');
/**
 * Creates a bower file with defined dependencies.
 */
class BowerBuilder {
  constructor(dir, arcDeps, webDeps, logger) {
    this.workingDir = dir;
    this.deps = arcDeps;
    this.webDeps = webDeps;
    this.logger = logger;
    this.bowerFile = 'bower.json';
  }
  /**
   * Generates bower file template and saves it in build location.
   * @return {Promise} Resolved promise when the file is ready.
   */
  build() {
    var content = this.bowerContent();
    return this.saveContent(content);
  }

  bowerContent() {
    this.logger.info('Preparing bower.json file content...');
    var b = {};
    b.name = 'arc-components';
    b.version = '1.0.0';
    b.main = 'import.html'; // prevents warning output
    var dependencies = this._prepareArcDependencies();
    dependencies = Object.assign(dependencies, this._prepareExtraDependencies());
    b.dependencies = dependencies;
    this.logger.info('bower.json file content ready.');
    return b;
  }
  /**
   * Saves bower file content to a file.
   *
   * @param {Object} content Bower definition as JavaScript object.
   * @return {Promise} A promise resolved when file is saved.
   */
  saveContent(content) {
    this.logger.info('Creating bower.json file...');
    var location = path.join(this.workingDir, this.bowerFile);
    return fs.ensureDir(this.workingDir)
    .then(() => fs.writeJson(location, content))
    .then(() => this.logger.info('bower.json file created.'));
  }

  _nameFromDependency(name) {
    if (!name) {
      throw new Error('Dependency name is not defined.');
    }
    var pos = name.lastIndexOf('/');
    if (pos !== -1) {
      name = name.substr(pos + 1);
    }
    pos = name.indexOf('#');
    if (pos !== -1) {
      name = name.substr(0, pos);
    }
    return name;
  }

  _prepareArcDependencies() {
    var deps = this.deps;
    if (!deps || !deps.length || !(deps instanceof Array)) {
      return {};
    }
    var result = {};
    deps.forEach(name => {
      let entryName = this._nameFromDependency(name);

      if (name.indexOf('/') === -1) {
        name = 'advanced-rest-client/' + name;
      }
      result[entryName] = name;
    });
    return result;
  }

  _prepareExtraDependencies() {
    var deps = this.webDeps;
    if (!deps || !deps.length || !(deps instanceof Array)) {
      return {};
    }
    var result = {};
    deps.forEach(name => {
      let entryName = this._nameFromDependency(name);
      result[entryName] = name;
    });
    return result;
  }
}

exports.BowerBuilder = BowerBuilder;
