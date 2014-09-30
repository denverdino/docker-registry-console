var request = require('request');
var Promise = require("es6-promise").Promise

//TODO Support user/password
var DockerImageRegistry = function() {
    this.host = '172.20.60.201';
    this.port = 5000;
    this.protocol = 'http';
    this.apiVersion = 'v1';
    this.baseURL = this.protocol + '://' + this.host + ':' + this.port + '/' + this.apiVersion;
}

DockerImageRegistry.prototype.buildURL = function(path, query) {
    return this.baseURL + path + ((query && query !='') ? '?' + query : '')
}

DockerImageRegistry.prototype.listImages = function() {
    return this.searchImages('');
}

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
}

DockerImageRegistry.prototype.retrieveTags = function(imageName, description) {
    var url = this.buildURL('/repositories/' + imageName + '/tags');
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                var result = []
                for (var tag in responseObject) {
                    var image = {
                        'name': imageName,
                        'tag': tag,
                        'id': responseObject[tag],
                        'description': description
                    };



                    result.push(image)
                }
                console.log(result);
                resolve(result);
            }
        })
    });
}

DockerImageRegistry.prototype.listTags = function(handler) {

    var that = this;
    var result = [];

    return that.searchImages('').then(function(images) {
        return Promise.all(
            images.map(function(image) {
                return that.retrieveTags(image.name, image.description)
            })
        );
    });
}

DockerImageRegistry.prototype.retriveImageDetails = function(id) {

    var url = this.baseURL + '/images/' + id + '/json';
    console.log(url);
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject);
            }
        })
    });
}

DockerImageRegistry.prototype.retriveImageAncestry = function(id) {

    var url = this.baseURL + '/images/' + id + '/ancestry';
    console.log(url);
    return new Promise(function(resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var responseObject = JSON.parse(body);
                resolve(responseObject);
            }
        })
    });
}


module.exports = new DockerImageRegistry();