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
        console.log("Invalid user credential for Docker Hub. Please change it in config.json");
        process.exit(1);
    });
};

DockerHub.prototype.login = function() {
    var options = this.buildRequestOptions('/users');

    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(true);
            } else {
                reject(false);
            }
        })
    });
};

DockerHub.prototype.listRepoImagesWithTag = function(repoName) {
    return this._listRepoImagesWithTag(repoName, this.registry);
};


DockerHub.prototype.listRepoTags = function(repoName) {
    return this._listRepoTags(repoName, this.registry);
};

module.exports = new DockerHub();