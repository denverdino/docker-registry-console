var util = require('util');
var request = require('request');
var Promise = require("es6-promise").Promise;
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
    if (registryConfig.cache) {
        //Build in memory cache and refresh every minute.
        this.buildIndex();
        setInterval(function() {
            that.buildIndex();
        }, 60000);
    }
};

DockerImageRegistry.prototype.buildIndex = function() {
    var that = this;
    this._searchRepoImagesWithTag().then(function(tags){
        var result = {
            imageTagIndex: {}
        };
        var imageTagIndex = result.imageTagIndex;

        tags.forEach(function(imageTags) {
            for (var i = 0, len = imageTags.length; i < len; ++i) {
                var item = imageTags[i];
                if (item.tag) {
                    var value = imageTagIndex[item.id];
                    if (value) {
                        value.push(item);
                    } else {
                        imageTagIndex[item.id] = [item];
                    }
                }
            }
        });
        console.log("Refresh cache completed!");
        that.cachedData = result;
        return result;
    });
};


DockerImageRegistry.prototype.listRepoTags = function(repoName) {
   return this._listRepoTags(repoName);
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

DockerImageRegistry.prototype.listRepoImagesWithTag = function(repoName) {
    return this._listRepoImagesWithTag(repoName, this);
};

DockerImageRegistry.prototype.retrieveRepoTags = function(repo) {
    var repoName = repo.name;
    var that = this;
    var options = this.buildRequestOptions('/repositories/' + repoName + '/tags');
    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                var result = [];
                for (var tag in responseObject) {
                    var image = {
                        'name': repoName,
                        'displayName': that.getDisplayName(repoName),
                        'tag': tag,
                        'id': responseObject[tag]
                    };
                    result.push(image)
                }
                resolve(result);
            }
        })
    });
};

DockerImageRegistry.prototype._searchRepoImagesWithTag = function(query) {
    var that = this;
    return that.searchRepositories(query).then(function(repositories) {
        return Promise.all(
            repositories.map(function(repo) {
                return that.retrieveRepoTags(repo)
            })
        );
    });
};

DockerImageRegistry.prototype.retrieveImageDetails = function(id) {
    var options = this.buildRequestOptions('/images/' + id + '/json');
    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject);
            }
            //TODO error handling
        })
    });
};

DockerImageRegistry.prototype.retrieveImageAncestry = function(id) {
    var options = this.buildRequestOptions('/images/' + id + '/ancestry');
    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject);
            }
        })
    });
};

DockerImageRegistry.prototype.searchRepoImagesWithTag = function(query) {
    var that = this;
    return that.searchRepositories(query).then(function(repositories) {
        return Promise.all(
            repositories.map(function (repo) {
                return that.retrieveRepoTags(repo).then(function(tags) {
                    return Promise.all(
                        tags.map(function(tag){
                            return that._retrieveRepoTagInfo(repo.name, tag.tag, null, tag);
                        })
                    );
                });
            })
        );
    }).then(function (tags) {
        var items = [];

        tags.forEach(function (imageTags) {
            for (var i = 0, len = imageTags.length; i < len; ++i) {
                var item = imageTags[i];
                items.push(item);
            }
        });
        //Sort by name and tag
        items.sort(function (a, b) {
            var result = 0;
            if (a.displayName > b.displayName) {
                result = 1;
            } else if (a.displayName < b.displayName) {
                result = -1;
            } else if (a.tag > b.tag) {
                result = 1;
            } else if (a.tag < b.tag) {
                result = -1;
            }
            return result;
        });
        return items;
    });
};

DockerImageRegistry.privateRegistry = new DockerImageRegistry(config.privateRegistry);

module.exports = DockerImageRegistry;