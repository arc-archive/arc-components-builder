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
 * Creates an import file with requested dependencies.
 */
class ImportBuilder {
  constructor(dir, arcDeps, extraDeps, logger) {
    this.workingDir = dir;
    this.deps = arcDeps;
    this.extraDeps = extraDeps;
    this.logger = logger;
    this.importFile = 'import.html';
  }
  /**
   * Generates import file template and saves it in build location.
   * @return {Promise} Resolved promise when the file is ready.
   */
  build() {
    var content = this.importContent();
    return this.saveContent(content);
  }
  /**
   * Computes value for the import file.
   *
   * @return {String} import.html file content
   */
  importContent() {
    this.logger.info('Preparing import.html file content...');
    var html = '<link rel="import" href="bower_components/polymer/polymer.html">\n';
    var dependencies = this._prepareDependencies(this.deps);
    dependencies = dependencies.concat(this._prepareDependencies(this.extraDeps));
    dependencies.forEach(dependency => {
      html += '<link rel="import" href="' + dependency + '">\n';
    });
    this.logger.info('import.html file content ready.');
    return html;
  }
  /**
   * Saves bower file content to a file.
   *
   * @param {Object} content Bower definition as JavaScript object.
   * @return {Promise} A promise resolved when file is saved.
   */
  saveContent(content) {
    this.logger.info('Creating import.html file...');
    var location = path.join(this.workingDir, this.importFile);
    return fs.ensureDir(this.workingDir)
    .then(() => fs.writeFile(location, content, 'utf8'))
    .then(() => this.logger.info('import.html file created.'));
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

  _prepareDependencies(deps) {
    if (!deps || !deps.length || !(deps instanceof Array)) {
      return [];
    }
    return deps.map(name => {
      let entryName = this._nameFromDependency(name);
      return 'bower_components/' + entryName + '/' + entryName + '.html';
    });
  }
}

exports.ImportBuilder = ImportBuilder;
