'use strict';

var request = require('request');
var config = require('../utils/config');
var Promise = require("es6-promise").Promise;
var util = require('util');
var CommonDockerService = require('./CommonDockerService');
var DockerImageRegistry = require('./DockerImageRegistry');

var DockerHub = function() {
    this.registry = new DockerImageRegistry(config.publicRegistry);
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
    var options = this.buildRequestOptions('/users/');
    return this.sendRequest(options);
};

DockerHub.prototype.listRepoImagesWithTag = function(repoName) {
    return this._listRepoImagesWithTag(repoName, this.registry);
};


DockerHub.prototype.listRepoTags = function(repoName) {
    return this._listRepoTags(repoName, this.registry);
};


DockerHub.prototype.retrieveRepositoryDetails = function(repoName) {
    return this._retrieveRepositoryDetails(repoName, this.registry);
};


module.exports = new DockerHub();