"use strict";
const _ = require("lodash");
const ensureApiEnabled = require("../../ensureApiEnabled");
const functionsConfig = require("../../functionsConfig");
const getProjectId = require("../../getProjectId");
const validator = require("./validate");
module.exports = function (context, options, payload) {
    if (!options.config.has("functions")) {
        return Promise.resolve();
    }
    const sourceDirName = options.config.get("functions.source");
    const sourceDir = options.config.path(sourceDirName);
    const projectDir = options.config.projectDir;
    const functionNames = payload.functions;
    const projectId = getProjectId(options);
    try {
        validator.functionsDirectoryExists(options.cwd, sourceDirName);
        validator.functionNamesAreValid(functionNames);
        validator.packageJsonIsValid(sourceDirName, sourceDir, projectDir);
    }
    catch (e) {
        return Promise.reject(e);
    }
    return Promise.all([
        ensureApiEnabled.ensure(options.project, "cloudfunctions.googleapis.com", "functions"),
        ensureApiEnabled.check(projectId, "runtimeconfig.googleapis.com", "runtimeconfig", true),
    ])
        .then(function (results) {
        _.set(context, "runtimeConfigEnabled", results[1]);
        return functionsConfig.getFirebaseConfig(options);
    })
        .then(function (result) {
        _.set(context, "firebaseConfig", result);
    });
};
