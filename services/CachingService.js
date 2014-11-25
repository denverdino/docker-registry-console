'use strict';

var redis = require("redis");
var config = require('../utils/config');

var CachingService = function() {
    console.log("Creating redis client");
    var client = redis.createClient(config.redis.port, config.redis.host, {});
    this.client = client;

    client.on('error', function (err) {
        console.log('Redis Client Error ' + err);
    });
};

CachingService.prototype.setJSON = function(key, value, ttl) {
    this.client.set(key, JSON.stringify(value), redis.print);
    this.client.expire(key, ttl);
};

CachingService.prototype.getJSON = function(key) {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.client.get(key, function (err, reply) {
            if (err) {
                reject(err);
            } else {
                var json = JSON.parse(reply);
                resolve(json);
            }
        });
    })
};

module.exports = new CachingService();