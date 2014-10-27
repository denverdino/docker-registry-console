"use strict";

var fs = require('fs');
var url = require('url');

module.exports = function(env) {
    var data = fs.readFileSync('./config.json');
    var config = null;

    try {
        config = JSON.parse(data);
        var registryName = env.REGISTRY_NAME;
        if (registryName) { //Handle the registry container link
            var privateRegistry = config.privateRegistry;
            privateRegistry.protocol = 'http';
            privateRegistry.host = 'registry';
            privateRegistry.port = parseInt(env.REGISTRY_PORT_5000_TCP_PORT);
            if (!privateRegistry.port) {
                console.log('Invalid environment variable "REGISTRY_PORT_5000_TCP_PORT".');
            }
        } else {
            var privateRegistryURL = env.PRIVATE_REGISTRY_URL;
            if (privateRegistryURL) {
                try {
                    var privateRegistry = url.parse(privateRegistryURL);
                    config.privateRegistry.protocol = privateRegistry.protocol.substr(0, privateRegistry.protocol.length - 1);
                    config.privateRegistry.host = privateRegistry.hostname;
                    if (!privateRegistry.port) {
                        if (config.privateRegistry.protocol == 'http') {
                            privateRegistry.port = 80;
                        } else if (config.privateRegistry.protocol == 'https') {
                            privateRegistry.port = 443;
                        }
                    }
                    config.privateRegistry.port = privateRegistry.port;
                }
                catch (err) {
                    console.log('Invalid environment variable "PRIVATE_REGISTRY_URL" will be ignored');
                    console.log(err);
                }
            }
        }

        var dockerHubUser = env.DOCKER_HUB_USER;
        if (dockerHubUser) {
            config.dockerHub.user = dockerHubUser;
        }

        var dockerHubPassword = env.DOCKER_HUB_PASSWORD;
        if (dockerHubPassword) {
            config.dockerHub.password = dockerHubPassword;
        }

        var redisHost = env.REDIS_HOST;
        var redisPort = env.REDIS_PORT;

        var redisName = env.REDIS_NAME;
        if (redisName) { //Handle the REDIS container link
            redisHost = 'redis';
            redisPort = env.REDIS_PORT_6379_TCP_PORT;
        }

        if (redisHost && redisPort) {
            var redisPortNumber = parseInt(redisPort);
            if (redisPortNumber) {
                config.redis.host = redisHost;
                config.redis.port = redisPortNumber;
            } else {
                console.log('Invalid environment variable "REDIS_PORT".');
            }
        }
    }
    catch (err) {
        console.log('There has been an error parsing the config JSON.');
        console.log(err);
        process.exit(1);
    }
    return config;
};