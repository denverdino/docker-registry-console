var request = require('request');
var Promise = require("es6-promise").Promise;
require('../utils/polyfill.js');
var DEFAULT_NAMESPACE = 'library/';

var DockerImageRegistry = function(registryConfig) {
    this.initialize(registryConfig);
};

DockerImageRegistry.prototype.initialize = function(registryConfig) {
    var registry = registryConfig;

    this.host = registry.host;
    this.port = registry.port;
    this.protocol = registry.protocol;
    this.apiVersion = registry.apiVersion;
    this.baseURL = this.protocol + '://' + this.host + ':' + this.port + '/' + this.apiVersion;
    this.cachedData = {
        imageTagIndex: {}
    };

    if (registry.user) {
        this.authorizationHeader = 'Basic ' + new Buffer(registry.user + ':' + registry.password).toString('base64');
    }

    var that = this;
    if (registry.cache) {
        //Build in memory cache and refresh every minute.
        this.buildIndex();
        setInterval(function() {
            that.buildIndex();
        }, 60000);
    }
};

DockerImageRegistry.prototype.buildRequestOptions = function(path, query) {
    var options = {
        url: this.baseURL + path + ((query && query != '') ? '?' + query : ''),
        header: {}
    };
    if (this.authorizationHeader) {
        options.header.Authorization = this.authorizationHeader;
    }
    console.log(options.url);
    return options;
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

DockerImageRegistry.prototype.retrieveRepository = function(repoName) {
    return this.searchRepositories(repoName).then(function(repositories){
        var result = null;
        var repoName2 = DEFAULT_NAMESPACE + repoName;
        for (var i = 0; i < repositories.length; i++) {
            var name = repositories[i].name;
            if (repoName === name || repoName2  === name) { //Found
                result = repositories[i];
                break;
            }
        }
        return result; //Not found
    });
};

DockerImageRegistry.prototype.retrieveRepoWithImages = function(repoName) {
    var that = this;
    return this.retrieveRepository(repoName).then(function(repository) {
        if (repository) {
            return that.listRepoImages(repoName).then(function (images) {
                repository.images =  images; //Not found
                return repository;
            });
        }
        return null;
    });
};


DockerImageRegistry.prototype.listRepositories = function() {
    return this.searchRepositories(null);
};

DockerImageRegistry.prototype.searchRepositories = function(query) {
    var queryString = '';
    if (query) {
        queryString = 'q=' + encodeURIComponent(query);
    }

    var options = this.buildRequestOptions('/search', queryString);

    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject.results);
            }
        })
    });
};

DockerImageRegistry.prototype.listRepoTags = function(repoName) {
    var repoURL = '/repositories/' + repoName;
    var tagOptions = this.buildRequestOptions(repoURL + '/tags');
    var that = this;
    return new Promise(function(resolve, reject) {
        request(tagOptions, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var tags = JSON.parse(body);
                if (Array.isArray(tags)) { //Docker Hub API
                    var tagList = tags;
                    tags = {};
                    var imageOptions = that.buildRequestOptions(repoURL + '/images');
                    request(imageOptions, function (error, response, body) {
                        var images = JSON.parse(body);
                        if (!error && response.statusCode == 200) {
                            for (var j = 0; j < tagList.length; j++) {
                                var tag = tagList[j].name;
                                var layer = tagList[j].layer;
                                for (var i = 0; i < images.length; i++) {
                                    //Get the full image id
                                    if (images[i].id.startsWith(layer)) {
                                        tags[tag] = images[i].id;
                                        break;
                                    }
                                }
                            }
                        }
                        resolve(tags);
                    })
                } else {
                    resolve(tags);
                }
            }
        })
    });
};

DockerImageRegistry.prototype.retrieveImageFromDockerHub = function(repoName, imageId) {
    return this.listRepoImages(repoName).then(function(images){
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

DockerImageRegistry.prototype.listRepoImages = function(repoName) {
    var repoURL = '/repositories/' + repoName;
    var imageOptions = this.buildRequestOptions(repoURL + '/images');
    var that = this;
    return new Promise(function(resolve, reject) {
        request(imageOptions, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var images = JSON.parse(body);
                resolve(images);
            }
        })
    }).then(function(images){
        var tagOptions = that.buildRequestOptions(repoURL + '/tags');
        return new Promise(function(resolve, reject) {
            request(tagOptions, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var tags = JSON.parse(body);
                    if (Array.isArray(tags)) { //Docker Hub API
                        var tagList = tags;
                        for (var j = 0; j < tagList.length; j++) {
                            var tag = tagList[j].name;
                            var layer = tagList[j].layer;
                            for (var i = 0; i < images.length; i++) {
                                //Get the full image id
                                if (images[i].id.startsWith(layer)) {
                                    if (images[i].tags) {
                                        images[i].tags.push(tag);
                                    } else {
                                        images[i].tags = [tag];
                                    }
                                }
                            }
                        }
                    } else {
                        for (var tag in tags) {
                            var value = tags[tag];
                            for (var i = 0; i < images.length; i ++) {
                                if (images[i].id.startsWith(value)) {
                                    if (images[i].tags) {
                                        images[i].tags.push(tag);
                                    } else {
                                        images[i].tags = [tag];
                                    }
                                }
                            }
                        }
                    }
                    resolve(images);
                }
            })
        });
    });
};

DockerImageRegistry.prototype.retrieveRepoTags = function(repoName, description) {
    var options = this.buildRequestOptions('/repositories/' + repoName + '/tags');
    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                var result = [];
                for (var tag in responseObject) {
                    var displayName = repoName;
                    if (repoName.startsWith(DEFAULT_NAMESPACE)) {
                        displayName = repoName.substring(DEFAULT_NAMESPACE.length)
                    }

                    var image = {
                        'name': repoName,
                        'displayName': displayName,
                        'tag': tag,
                        'id': responseObject[tag],
                        'description': description
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
                return that.retrieveRepoTags(repo.name, repo.description)
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

    return this._searchRepoImagesWithTag(query).then(function (tags) {
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

module.exports = DockerImageRegistry;