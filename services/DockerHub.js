'use strict';

var request = require('request');
var config = require('../utils/config');
var Promise = require("es6-promise").Promise;
var util = require('util');
var CommonDockerService = require('./CommonDockerService');
var DockerImageRegistry = require('./DockerImageRegistry');
var RESTService = require('./RESTService');

var DockerHub = function() {
    this.initialize(config.dockerHub);
};

util.inherits(DockerHub, CommonDockerService);

DockerHub.prototype.initialize = function(registryConfig) {
    this.initializeConfig(registryConfig);
    //Test credential
    this.login().then(null, function(result) {
        console.log(result);
        console.log("Invalid user credential for Docker Hub. Please change it in config.json");
        //process.exit(1);
    });
};

DockerHub.prototype.login = function() {
    return new RESTService(this.config).GET('/users/');
};

DockerHub.prototype.getRegistryService = function(repoName) {
    return new RESTService(config.publicRegistry);
};


module.exports = new DockerHub();