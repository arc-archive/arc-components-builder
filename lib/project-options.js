'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

/**
 * Class to prepare and validate user options.
 */
class ProjectOptions {
  constructor(opts) {
    opts = opts || {};
    this.validateOptions(opts);
    if (!this.isValid) {
      return;
    }
    /**
     * A list of ARC components to be used.
     * It should be names of the components only, without `advanced-rest-client/`
     * prefix as it will be added by the program.
     *
     * You can control version of the component by adding version number for the
     * components as in npm or bower.
     *
     * Example: `['paper-autocomplete#1.0.0', 'raml-request-panel#^1.1.0']`
     *
     * @type {Array<String>}
     */
    this.arcComponents = opts.arcComponents;
    /**
     * List of any web components that do not originate from ARC's organization
     * repository.
     *
     * You can control version of the component by adding version number for the
     * components as in npm or bower.
     *
     * Example: `['PolymerElements/paper-input', 'PolymerElements/paper-icon-button#1.0.0']`
     * @type {Array<String>}
     */
    this.webComponents = opts.webComponents;
    /**
     * Polymer's `custom-style` module declaration for theming the elements.
     * It must be a local path to the resource.
     *
     * See https://www.polymer-project.org/2.0/docs/devguide/style-shadow-dom#custom-style
     * for more information.
     *
     * @type {String}
     */
    this.style = opts.style;
    /**
     * If set it will not create a bundle file but rather import file with
     * reference to `bower_components` directory where the source code of the elements
     * is downloaded. It can be helpful for dubugging when you'd like to debug
     * specific element.
     *
     * The build dir will contain the import file and `bower_components` which
     * both should be copied to server path.
     *
     * @type {Boolean}
     */
    this.dev = opts.dev;
    /**
     * Specify to generate React components definition from the elements.
     * Generated source file will contain classes definitions for each component
     * with access points to all public APIs of the element (properties, functions
     * custom events).
     *
     * @type {Boolean}
     */
    this.react = opts.react;
    /**
     * List of web components names to be exposed to generated React component
     * so it can be included in React application.
     *
     * Defining this option is optional. By default all listed components
     * in `arcComponents` and `webComponents` properties are exposed to React
     * application.
     *
     * To reduce size of generated code it is a good idea to declare number
     * of components that your application is using.
     *
     * Provide list of components names only, without any repository path.
     * For example `['raml-request-panel', 'paper-input']`
     *
     * @type {Array<String>}
     */
    this.reactComponents = opts.reactComponents;
    /**
     * Instance of any logger library that has `log()`, `info()`, `warn()`
     * and `error()` functions. If not provided a console's output will be used.
     *
     * @type {Object}
     */
    this.logger = opts.logger;
    /**
     * If set then it prints verbose messages.
     *
     * @type {Boolean}
     */
    this.verbose = opts.verbose;
    /**
     * The destination where the build files are put. Absolute or relative
     * path.
     *
     * By default it puts the files into `build` directory of the working dir.
     *
     * @type {String}
     */
    this.dest = opts.dest;
  }

  get validOptions() {
    return [{
      type: Array,
      name: 'arcComponents'
    }, {
      type: Array,
      name: 'webComponents'
    }, {
      type: String,
      name: 'style'
    }, {
      type: Boolean,
      name: 'dev'
    }, {
      type: Boolean,
      name: 'react'
    }, {
      type: Array,
      name: 'reactComponents'
    }, {
      type: Boolean,
      name: 'verbose'
    }, {
      type: Object,
      name: 'logger'
    }, {
      type: String,
      name: 'dest'
    }];
  }

  get isValid() {
    return !!(this.validationErrors &&  this.validationErrors.length === 0);
  }

  validateOptions(userOpts) {
    userOpts = userOpts || {};

    this.validationErrors = [];
    this.validationWarnings = [];

    this._validateOptionsList(userOpts);
    this._validateRequired(userOpts);
    this._validateReactOptions(userOpts);
    this._validateLogger(userOpts);
  }

  _validateOptionsList(userOpts) {
    var keys = Object.keys(userOpts);
    var known = this.validOptions;
    var unknown = [];
    var typeMissmatch = [];
    keys.forEach(property => {
      let index = known.findIndex(rule => rule.name === property);
      if (index === -1) {
        unknown.push(property);
        return;
      }
      let type = typeof userOpts[property];
      if (type === 'object') {
        if (userOpts[property] instanceof Array) {
          type = 'array';
        }
      }
      let expected = known[index].type.name;
      if (type !== expected.toLowerCase()) {
        typeMissmatch.push([property, type[0].toLocaleUpperCase() + type.substr(1), expected]);
      }
    });

    if (unknown.length) {
      let message = 'Unknown option';
      if (unknown.length > 1) {
        message += 's';
      }
      message += ': ' + unknown.join(', ');
      this.validationErrors.push(message);
    }
    typeMissmatch.forEach(info => {
      let message = 'Type missmatch. Property ' + info[0] + ' expected to be a ';
      message += info[2] + ' but ' + info[1] + ' was given';
      this.validationErrors.push(message);
    });
  }

  _validateRequired(userOpts) {
    var hasArcComponents = !!(userOpts.arcComponents && userOpts.arcComponents.length);
    var hasExtraComponents = !!(userOpts.webComponents && userOpts.webComponents.length);
    if (!hasArcComponents && !hasExtraComponents) {
      let message = 'Either arcComponents or webComponents must be specified.';
      this.validationErrors.push(message);
    }
  }

  _validateReactOptions(userOpts) {
    if (userOpts.reactComponents && userOpts.reactComponents.length && !userOpts.react) {
      let message = '"reactComponents" option given but "react" is not set. ';
      message += 'This option will be ignored.';
      this.validationWarnings.push(message);
      delete userOpts.reactComponents;
    }
  }

  _validateLogger(userOpts) {
    var logger = userOpts.logger;
    if (!logger) {
      return;
    }
    var messages = [];
    if (typeof logger.info !== 'function') {
      messages.push('info');
    }
    if (typeof logger.log !== 'function') {
      messages.push('log');
    }
    if (typeof logger.warn !== 'function') {
      messages.push('warn');
    }
    if (typeof logger.error !== 'function') {
      messages.push('error');
    }
    if (messages.length) {
      let message = 'Used logger is missing required functions: ' + messages.join(', ');
      this.validationWarnings.push(message);
      delete userOpts.logger;
    }
  }
}
exports.ProjectOptions = ProjectOptions;
