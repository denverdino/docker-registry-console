'use strict';

var configLoader = require('../utils/configLoader');

module.exports = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        // clean up
        callback();
    },
    testDefault: function (test) {
        var env = {};
        var config = configLoader(env);
        test.ok(config.dockerHub.host == 'registry.hub.docker.com', 'Failed to load the config.json');
        test.done();
    },
    testWithPRIVATE_REGISTRY_URL: function (test) {
        var env = {
            PRIVATE_REGISTRY_URL: 'https://192.168.1.1:5001'
        };
        var config = configLoader(env);
        test.ok(config.privateRegistry.protocol == 'https', 'Failed to parse the protocol from PRIVATE_REGISTRY_URL');
        test.ok(config.privateRegistry.host == '192.168.1.1', 'Failed to parse the host from PRIVATE_REGISTRY_URL');
        test.ok(config.privateRegistry.port == 5001, 'Failed to parse the port from PRIVATE_REGISTRY_URL');
        test.done();
    },
    testWithPRIVATE_REGISTRY_URL1: function (test) {
        var env = {
            PRIVATE_REGISTRY_URL: 'https://test'
        };
        var config = configLoader(env);
        test.ok(config.privateRegistry.protocol == 'https', 'Failed to parse the protocol from PRIVATE_REGISTRY_URL');
        test.ok(config.privateRegistry.host == 'test', 'Failed to parse the host from PRIVATE_REGISTRY_URL');
        test.ok(config.privateRegistry.port == 443, 'Failed to parse the port from PRIVATE_REGISTRY_URL');
        test.done();
    },
    testWithDOCKER_HUB: function (test) {
        var env = {
            DOCKER_HUB_USER: 'test',
            DOCKER_HUB_PASSWORD: 'testpassword'
        };
        var config = configLoader(env);
        test.ok(config.dockerHub.user == 'test', 'Failed to handle DOCKER_HUB_USER');
        test.ok(config.dockerHub.password == 'testpassword', 'Failed to handle DOCKER_HUB_PASSWORD');
        test.done();
    },
    testWithREDIS: function (test) {
        var env = {
            REDIS_HOST: 'testredis',
            REDIS_PORT: '12345'
        };
        var config = configLoader(env);
        test.ok(config.redis.host == 'testredis', 'Failed to handle REDIS_HOST');
        test.ok(config.redis.port == 12345, 'Failed to handle REDIS_PORT');
        test.done();
    },
    testWithREDISContainer: function (test) {
        var env = {
            REDIS_NAME: '/web/redis',
            REDIS_PORT_6379_TCP_PORT: '8888',
            REDIS_HOST: 'testredis',
            REDIS_PORT: '12345'
        };
        var config = configLoader(env);
        test.ok(config.redis.host == 'redis', 'Failed to handle REDIS_NAME');
        test.ok(config.redis.port == 8888, 'Failed to handle REDIS_PORT_6379_TCP_PORT');
        test.done();
    }
};