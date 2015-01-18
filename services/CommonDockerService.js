'use strict';

var request = require('request');
var cachingService = require('./CachingService');
var RESTService = require('./RESTService');
var Index = require('../models/Index');
var Image = require('../models/Image');
var Repository = require('../models/Repository');

var CommonDockerService = function() {
};


CommonDockerService.prototype.getRepository = function(id) {
    return new Repository(new RESTService(this.config), id);
};

CommonDockerService.prototype.getIndex = function() {
    return new Index(new RESTService(this.config));
};

CommonDockerService.prototype.getImage = function(id) {
    return new Image(new RESTService(this.config), id);
};

CommonDockerService.prototype.initializeConfig = function(config) {
    this.config = config;
    this.registryHost = config.registryHost;
};

CommonDockerService.prototype.listRepositories = function() {
    return this.getIndex().listRepositories();
};

CommonDockerService.prototype.searchRepositories = function(query) {
    return this.getIndex().searchRepositories(query);
};


CommonDockerService.prototype.listRepoImages = function(repoName) {
    return this.getRepository(repoName).images();
};

CommonDockerService.prototype.getRegistryService = function() {
    return new RESTService(this.config);
};


CommonDockerService.prototype.listRepoImagesWithTag = function(repoName) {
    return this.getRepository(repoName).imagesWithTag(this.getRegistryService());
};

CommonDockerService.prototype.listRepoTags = function(repoName) {
    return this.getRepository(repoName).tags(this.getRegistryService());
};


CommonDockerService.prototype.retrieveRepository = function(repoName) {
    return this.getIndex().retrieveRepository(repoName);
};

CommonDockerService.prototype.retrieveRepoWithImages = function(repoName) {
    var that = this;
    return this.retrieveRepository(repoName).then(function(repository) {
        if (repository) {
            return that.listRepoImagesWithTag(repoName).then(function(images) {
                repository.images =  images; //Not found
                return repository;
            });
        }
        return null;
    });
};

CommonDockerService.prototype.retrieveRepositoryDetails = function(repoName) {
    var that = this;
    return this.retrieveRepository(repoName).then(function(repository) {
        return that.getRepository(repoName).details(repository, that.getRegistryService());
    })
};

CommonDockerService.prototype.deleteRepoTag = function(repoName, tag) {
    return this.getRepository(repoName).deleteTag(tag);
};

module.exports = CommonDockerService;