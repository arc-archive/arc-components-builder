'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const gulp = require('gulp');
const gulpif = require('gulp-if');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const through = require('through2');
const path = require('path');

class ArcComponentsBuilder {
  constructor(workingDir, logger) {
    this.logger = logger;
    this.workingDir = workingDir;
  }

  /**
   * Initializes the PolymerProject from polymerBuild package.
   */
  initializeBuilder() {
    this.logger.info('Initializing Polymer builder...');
    const main = path.join(this.workingDir, 'import.html');
    this.logger.info('Building api console from ', main);
    var options = {
      entrypoint: main,
      // shell: main,
      fragments: []
    };
    this.polymerProject = new polymerBuild.PolymerProject(options);
  }

  /**
   * Builds the API Console with Polymer builder
   * and copies dependencies to the build folder.
   *
   * @return {Promise} A promise resolved when build complete.
   */
  build() {
    this.logger.info('Starting the build.');
    this.initializeBuilder();
    return this.buildPolymer();
  }

  buildPolymer() {
    this.logger.info('Building app with Polymer build...');

    return new Promise((resolve, reject) => {
      let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
      let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();
      this.logger.info('Analyzing sources...');
      const errorThrow = (err) => {
        reject(new Error(err.message));
      };
      const errorFn = (err) => {
        reject(new Error(err.message));
      };
      const jsRe = /\.js$/;

      let sourcesStream = this.polymerProject.sources();
      sourcesStream = sourcesStream.pipe(sourcesStreamSplitter.split())
      .on('error', errorThrow)
      .pipe(gulpif(jsRe, this.fixJsMinification()))
      .on('error', errorThrow)
      .pipe(sourcesStreamSplitter.rejoin());

      let dependenciesStream = this.polymerProject.dependencies();
      dependenciesStream = dependenciesStream
      .on('error', errorFn)
      .pipe(dependenciesStreamSplitter.split())
      .on('end', () => {
        this.logger.info('Fixing minification issues...');
      })
      .on('error', errorFn)
      .pipe(gulpif(jsRe, this.fixJsMinification()))
      .pipe(dependenciesStreamSplitter.rejoin())
      .on('error', function(err) {
        console.error('Dependency stream rejoin error: ' + err.message);
        reject(new Error(err.message));
      });

      let buildStream = mergeStream(sourcesStream, dependenciesStream);
      // The bundler merges everything together.
      buildStream = buildStream.pipe(this.polymerProject.bundler());
      buildStream = buildStream.pipe(gulp.dest('./'));
      buildStream.on('end', () => {
        this.logger.info('Polymer build complete.');
        resolve();
      });
      buildStream.on('error', function(err) {
        console.error('Build stream error: ' + err.message);
        reject(new Error(err.message));
      });
    });
  }

  /**
   * Vulcanizer replaces all `-->` into `\x3e0` which cause JS error.
   * Need to find `-->` and replace it with `-- >`.
   *
   * This should be done for JS files only.
   *
   * https://github.com/Polymer/polymer-bundler/issues/304
   */
  fixJsMinification() {
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        file.contents = new Buffer(String(file.contents).replace(/-->/gm, '-- >'));
      }
      this.push(file);
      cb();
    });
    return stream;
  }
}
exports.ArcComponentsBuilder = ArcComponentsBuilder;
