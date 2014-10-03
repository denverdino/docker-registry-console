var request = require('request');
var Promise = require("es6-promise").Promise;

//TODO Support the user settings for Image registry
var DockerImageRegistry = function(config) {
    this.initialize(config);
};

DockerImageRegistry.prototype.initialize = function(config) {
    var registry = config.registry;

    this.host = registry.host;
    this.port = registry.port;
    this.protocol = registry.protocol;
    this.apiVersion = registry.apiVersion;
    this.baseURL = this.protocol + '://' + this.host + ':' + this.port + '/' + this.apiVersion;
    this.cachedData = {
        imageTags: [],
        tagIndex: {}
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
    return options;
};

DockerImageRegistry.prototype.buildIndex = function() {
    var that = this;
    this.listTags().then(function(tags){
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
    var options = this.buildRequestOptions('/search', query);
    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject.results);
            }
        })
    });
};

DockerImageRegistry.prototype.retrieveTags = function(imageName, description) {
    var options = this.buildRequestOptions('/repositories/' + imageName + '/tags');
    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                var result = [];
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


module.exports = DockerImageRegistry;