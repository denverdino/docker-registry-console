'use strict';

var request = require('request');
var cachingService = require('./CachingService');


var CommonDockerService = function() {
};

CommonDockerService.prototype.DEFAULT_NAMESPACE = 'library/';

CommonDockerService.prototype.initializeConfig = function(config) {
    this.config = config;
    this.baseURL = config.protocol + '://' + config.host + ':' + config.port + '/' + config.apiVersion;

    if (config.user) {
        this.authorizationHeader = 'Basic ' + new Buffer(config.user + ':' + config.password).toString('base64');
    }

};

CommonDockerService.prototype.buildRequestOptions = function(path, query, token) {
    var options = {
        url: this.baseURL + path + ((query && query != '') ? '?' + query : ''),
        headers: {}
    };

    if (token) {
        options.headers['Authorization'] = 'Token ' + token;
    } else if (this.authorizationHeader) {
        options.headers['Authorization'] = this.authorizationHeader;
        options.headers['X-Docker-Token'] = 'true';
    }

    return options;
};

CommonDockerService.prototype.listRepositories = function() {
    return this.searchRepositories(null);
};

CommonDockerService.prototype.searchRepositories = function(query) {
    var queryString = '';
    if (query) {
        queryString = 'q=' + encodeURIComponent(query);
    }

    var options = this.buildRequestOptions('/search', queryString);
    var that = this;
    return this.sendRequest(options).then(function(result) {
        return result.results;
    });
};


CommonDockerService.prototype._listRepoImages = function(repoName) {
    var options = this.buildRequestOptions('/repositories/' + repoName + '/images');
    return this.sendRequest(options).then(function(images) {
        var result = {
            token: options['x-docker-token'],
            images: images
        };
        return result;
    });
};

CommonDockerService.prototype.sendRequest = function(options, log) {
    var that = this;

    return cachingService.getJSON(options.url).then(function (result) {
        if (result) {
            var token = result['x-docker-token'];
            if (token) {
                options['x-docker-token'] = token;
            }
            return result.body;
        }
        return new Promise(function (resolve, reject) {
            request(options, function (error, response, body) {
                if (error) {
                    console.log('Failed to send request: %s %s', request.method, options.url);
                    console.log(error);
                    reject(error);
                } else if (response.statusCode != 200) {
                    that.logRequest(this, response, true, true);
                    var err = new Error("Unexpected status code: " + response.statusCode);
                    err.status = response.statusCode;
                    reject(err);
                } else {
                    if (log) {
                        that.logRequest(this, response, true, true);
                    }
                    var json = JSON.parse(body);
                    var cacheValue = {
                        body: json
                    };
                    var token = response.headers['x-docker-token'];
                    if (token) {
                        cacheValue['x-docker-token'] = token;
                        options['x-docker-token'] = token; //Pass to future processing
                    }
                    cachingService.setJSON(options.url, cacheValue, that.config.ttl);
                    resolve(json);
                }
            })
        });
    });
};

CommonDockerService.prototype._listRepoTagsWithToken = function(repoName, token) {
    var options = this.buildRequestOptions('/repositories/' + repoName + '/tags', null, token);
    var that = this;
    return this.sendRequest(options);
};

CommonDockerService.prototype._retrieveRepoTagInfo = function(repoName, tagName, token, tag) {
    var options = this.buildRequestOptions('/repositories/' + repoName + '/tags/' + tagName + '/json', null, token);
    var that = this;
    return (!tag) ? this.sendRequest(options) : this.sendRequest(options).then(function(json){
        Object.assign(tag, json);
        return tag;
    });
};

CommonDockerService.prototype._listRepoImagesWithTag = function(repoName, registry) {

    return this._listRepoImages(repoName).then(function(result){
        var images = result.images;
        var token = result.token;
        return registry._listRepoTagsWithToken(repoName, token).then(function (tags) {
            for (var tag in tags) {
                var value = tags[tag];
                for (var i = 0; i < images.length; i++) {
                    if (images[i].id.startsWith(value)) {
                        if (images[i].tags) {
                            images[i].tags.push(tag);
                        } else {
                            images[i].tags = [tag];
                        }
                    }
                }
            }
            return images;
        });
    });
};


CommonDockerService.prototype._listRepoTags = function(repoName, registry) {
    if (registry) {
        return this._listRepoImages(repoName).then(function(result){
            var token = result.token;
            return registry._listRepoTagsWithToken(repoName, token);
        });
    } else {
        return this._listRepoTagsWithToken(repoName);
    }
};

CommonDockerService.prototype.logRequest = function(request, response, headers, body) {
    console.log('Request: %s %s', request.method, request.uri.href, response.statusCode);
    console.log('Status Code: %s', response.statusCode);
    if (headers) {
        console.log('Headers: %j', response.headers);
    }
    if (body) {
        console.log('Body: %j', response.body);
    }
};


CommonDockerService.prototype.retrieveRepository = function(repoName) {
    var that = this;
    return this.searchRepositories(repoName).then(function(repositories){
        var result = null;
        repoName = that.getRepoNameWithNS(repoName);
        for (var i = 0; i < repositories.length; i++) {
            var name = that.getRepoNameWithNS(repositories[i].name);
            if (repoName == name) { //Found
                result = repositories[i];
                break;
            }
        }
        return result; //Not found
    });
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

CommonDockerService.prototype.getDisplayName = function(repoName) {
    return (repoName.startsWith(this.DEFAULT_NAMESPACE))? repoName.substring(this.DEFAULT_NAMESPACE.length) : repoName;
};

CommonDockerService.prototype.getRepoNameWithNS = function(repoName) {
    return (repoName.indexOf('/') >= 0)? repoName : this.DEFAULT_NAMESPACE + repoName;
};


CommonDockerService.prototype.tagsToList = function(tags) {
    var items = [];
    for (var name in tags) {
        var item = {
            name: name,
            id: tags[name]
        };
        items.push(item);
    }
    return items;
};


CommonDockerService.prototype.retrieveImageDetails = function(id, token) {
    var options = this.buildRequestOptions('/images/' + id + '/json', null, token);
    var that = this;
    return this.sendRequest(options);
};

CommonDockerService.prototype._retrieveRepositoryDetails = function(repoName, registry) {
    var that = this;
    if (registry) {
        return this.retrieveRepository(repoName).then(function(repository) {
            if (repository) {
                return that._listRepoImages(repoName).then(function (result) {
                    var token = result.token;
                    var images = result.images;
                    return registry._listRepoTagsWithToken(repoName, token).then(function (tags) {
                        var tagList = registry.tagsToList(tags);
                        return Promise.all(
                            tagList.map(function (tag) {
                                return registry.retrieveImageDetails(tag.id, token).then(function (info) {
                                    info.repository = repoName;
                                    info.tag = tag.name;
                                    return info;
                                });
                            })
                        ).then(function(tagsInfo) {
                            repository.tags = tagsInfo;
                            return repository;
                        });
                    });
                });
            }
            return null;
        })
    } else {
        return this.retrieveRepository(repoName).then(function(repository) {
            if (repository) {
                return that._listRepoTagsWithToken(repoName).then(function (tags) {
                    var tagList = that.tagsToList(tags);
                    return Promise.all(
                        tagList.map(function (tag) {
                            return that.retrieveImageDetails(tag.id).then(function (info) {
                                info.repository = repoName;
                                info.tag = tag.name;
                                return info;
                            });
                        })
                    ).then(function(tagsInfo) {
                        repository.tags = tagsInfo;
                        return repository;
                    })
                });
            } else {
                return null;
            }
        })
    }

};

module.exports = CommonDockerService;