'use strict';

var util = require('util');
var request = require('request');
var CommonDockerService = require('./CommonDockerService');

var config = require('../utils/config');


var DockerImageRegistry = function(registryConfig) {
    this.initialize(registryConfig);
};

util.inherits(DockerImageRegistry, CommonDockerService);

DockerImageRegistry.prototype.initialize = function(registryConfig) {

    this.initializeConfig(registryConfig);

    this.cachedData = {
        imageTagIndex: {}
    };

    var that = this;
    if (registryConfig.layerIndex) {
        //Build in memory cache and refresh every minute.
        this.buildIndex();
        setInterval(function() { //Every 10 minutes
            that.buildIndex();
        }, 600000);
    }
};

DockerImageRegistry.prototype.buildIndex = function () {
    this.getIndex().buildIndex().then(function(result) {
        that.cachedData = result;
    });
};

DockerImageRegistry.prototype.retrieveImageFromDockerHub = function(repoName, imageId) {
    return this.listRepoImagesWithTag(repoName).then(function(images){
        var result = null;
        for (var i = 0; i < images.length; i++) {
            var image = images[i];
            if (image.id === imageId) { //Found
                result = image;
                break;
            }
        }
        return result; //Not found
    })
};

DockerImageRegistry.prototype.getLayerDisplayName = function(layer) {
    var displayName = null;
    var images = this.cachedData.imageTagIndex[layer];
    if (images) {
        displayName = '';
        for (var i = 0; i < images.length; i++) {
            if (i > 0) {
                displayName += ', '
            }
            displayName += images[i].displayName + ':' + images[i].tag;
        }
    }
    return displayName;
};


DockerImageRegistry.prototype.searchRepoImagesWithTag = function(query) {
    return this.getIndex().searchRepoImagesWithTag(query);
};

DockerImageRegistry.prototype.retrieveImageDetails = function(id) {
    var that = this;
    return this.getImage(id).details().then(function(image) {
        image.ancestry.forEach(function(layer) {
            layer.displayName = that.getLayerDisplayName(layer.id);
        });
        return image;
    });
};

DockerImageRegistry.privateRegistry = new DockerImageRegistry(config.privateRegistry);

module.exports = DockerImageRegistry;