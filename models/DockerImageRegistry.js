var request = require('request');
var Promise = require("es6-promise").Promise;

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

function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

DockerImageRegistry.prototype.listImages = function() {
    return this.searchImages(null);
};

DockerImageRegistry.prototype.searchImages = function(query) {
    var queryString = '';
    if (query) {
        queryString = 'q=' + fixedEncodeURIComponent(query);
    }

    var options = this.buildRequestOptions('/search', queryString);
    console.log(options.url);
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

DockerImageRegistry.prototype.listTags = function(query) {
    var that = this;
    return that.searchImages(query).then(function(images) {
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

DockerImageRegistry.prototype.listImageTags = function(query) {

    return this.listTags(query).then(function (tags) {
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