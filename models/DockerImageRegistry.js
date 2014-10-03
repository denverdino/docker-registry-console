var request = require('request');
var Promise = require("es6-promise").Promise;

//TODO Support the user settings for Image Regristry
//TODO Support user/password
var DockerImageRegistry = function() {
    var config = {
        registry: {
            host: '172.20.60.201',
            port: 5000,
            protocol: 'http',
            apiVersion: 'v1'
        }
    };
    this.initialize(config);
};


DockerImageRegistry.prototype.initialize = function(config) {
    this.host = config.registry.host;
    this.port = config.registry.port;
    this.protocol = config.registry.protocol;
    this.apiVersion = config.registry.apiVersion;
    this.baseURL = this.protocol + '://' + this.host + ':' + this.port + '/' + this.apiVersion;
    this.cachedData = {
        imageTags: [],
        tagIndex: {}
    };
    this.buildIndex();
};


DockerImageRegistry.prototype.buildURL = function(path, query) {
    return this.baseURL + path + ((query && query !='') ? '?' + query : '')
};


DockerImageRegistry.prototype.buildIndex = function() {
    var that = this;
    this.listTags().then(function(tags){
        console.log("I am there!");
        var result = {};
        var items = [];
        var tagIndex = {};
        result.imageTags = items;
        result.tagIndex = tagIndex;

        tags.forEach(function(imageTags) {
            for (var i = 0, len = imageTags.length; i < len; ++i) {
                var item = imageTags[i];
                items.push(item);
                tagIndex[item.id] = item;
            }
        });
        console.log("Refresh cache completed!");
        that.cachedData = result;
        return result;
    });
};




DockerImageRegistry.prototype.listImages = function() {
    return this.searchImages('');
};

DockerImageRegistry.prototype.searchImages = function(query) {
    var url = this.buildURL('/search', query);
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject.results);
            }
        })
    });
};

DockerImageRegistry.prototype.retrieveTags = function(imageName, description) {
    var url = this.buildURL('/repositories/' + imageName + '/tags');
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                var result = []
                for (var tag in responseObject) {
                    var displayName = imageName;
                    if (imageName.startsWith('library')) {
                        displayName = imageName.substring('library'.length + 1)
                    }

                    var image = {
                        'name': imageName,
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

DockerImageRegistry.prototype.listTags = function() {
    var that = this;
    return that.searchImages('').then(function(images) {
        return Promise.all(
            images.map(function(image) {
                return that.retrieveTags(image.name, image.description)
            })
        );
    });
};

DockerImageRegistry.prototype.retriveImageDetails = function(id) {

    var url = this.baseURL + '/images/' + id + '/json';
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject);
            }
            //TODO error handling
        })
    });
};

DockerImageRegistry.prototype.retriveImageAncestry = function(id) {

    var url = this.baseURL + '/images/' + id + '/ancestry';
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject);
            }
        })
    });
};


module.exports = new DockerImageRegistry();