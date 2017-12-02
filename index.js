'use strict';

/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

const {ArcComponentsProject} = require('./lib/project.js');
const {ProjectOptions} = require('./lib/project-options.js');

module.exports = function(options) {
  if (!(options instanceof ProjectOptions)) {
    options = new ProjectOptions(options);
  }

  const project = new ArcComponentsProject(options);
  return project.build();
};

module.exports.ArcComponentsProject = ArcComponentsProject;
module.exports.ArcComponentsProjectOptions = ProjectOptions;
