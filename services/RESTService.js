'use strict';


var request = require('request');
var cachingService = require('./CachingService');

var RESTService = function(config) {
    this.config = config;

    this.baseURL = config.baseURL;
    this.registryHost =  config.registryHost;


    if (config.user) {
        this.authorizationHeader = 'Basic ' + new Buffer(config.user + ':' + config.password).toString('base64');
    }

    this.token = null;
    //this.log = true;
};

RESTService.prototype.buildRequestOptions = function(path, query) {
    var options = {
        url: this.baseURL + path + ((query && query != '') ? '?' + query : ''),
        headers: {
            'Accept': 'application/json'
        }
    };
    if (this.token) {
        options.headers['Authorization'] = 'Token ' + this.token;
    } else if (this.authorizationHeader) {
        options.headers['Authorization'] = this.authorizationHeader;
        options.headers['X-Docker-Token'] = 'true';
    }

    return options;
};

RESTService.prototype.GET = function(path, query) {
    return this.sendRequest('GET', path, query);
};

RESTService.prototype.POST = function(path) {
    return this.sendRequest('POST', path);
};

RESTService.prototype.PUT = function(path) {
    return this.sendRequest('PUT', path);
};

RESTService.prototype.DELETE = function(path) {
    return this.sendRequest('DELETE', path);
};

RESTService.prototype.sendRequest = function(method, path, query) {

    var options = this.buildRequestOptions(path, query);
    options.method = method;
    var log = this.log;

    var that = this;

    var promise = new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (error) {
                console.log('Failed to send request: %s %s', method, options.url);
                console.log(error);
                reject(error);
            } else if (response.statusCode != 200) {
                that.logRequest(this, response, true, true);
                var err = new Error("Unexpected status code: " + response.statusCode);
                err.status = response.statusCode;
                reject(err);
            } else {
                if (log) {
                    that.logRequest(this, response, true, false);
                }
                var json = JSON.parse(body);

                var token = response.headers['x-docker-token'];
                if (token) {
                    that.token = token; //Pass to future processing
                }
                if (method === 'GET') { //Cache
                    var cacheValue = {
                        body: json,
                        'x-docker-token': token
                    };
                    cachingService.setJSON(options.url, cacheValue, that.config.ttl);
                } else if (method === 'DELETE') {
                    console.log('Delete URL: %s', options.url);
                    cachingService.delete(options.url);
                }
                resolve(json);
            }
        });
    });
    if (method === 'GET') {
        return cachingService.getJSON(options.url).then(function (result) {
            if (result) {
                var token = result['x-docker-token'];
                if (token) {
                    that.token = token;
                }
                return result.body;
            } else {
                return promise;
            }
        });
    } else {
        return promise;
    }
};

RESTService.prototype.logRequest = function(request, response, headers, body) {
    console.log('Request: %s %s', request.method, request.uri.href, response.statusCode);
    console.log('Status Code: %s', response.statusCode);
    if (headers) {
        console.log('Headers: %j', response.headers);
    }
    if (body) {
        console.log('Body: %j', response.body);
    }
};

module.exports = RESTService;
