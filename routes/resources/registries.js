var config = require('../../utils/config');
var DockerImageRegistry = require('../../models/DockerImageRegistry');
var express = require('express');
var url = require("url");

module.exports = function(publicRegistry) {

    var router = express.Router();

    var dockerHub = new DockerImageRegistry(config.dockerHub);

    var registry = (publicRegistry)? dockerHub : new DockerImageRegistry(config.registry);

    var getRepoName = function(req) {
        return (req.params.namespace)? req.params.namespace + '/' + req.params.repoId: req.params.repoId;
    };

    var processResult = function(res, result) {
        if (result) {
            res.json(result);
        } else {
            res.status(404).send('Not found');
        }
    };

    var handleListRepoTags = function(req, res) {
        registry.listRepoTags(getRepoName(req)).then(function (tags) {
            processResult(res, tags);
        });
    };

    router.get('/:repoId/tags', handleListRepoTags);
    router.get('/:namespace/:repoId/tags', handleListRepoTags);

    var handleRetrieveRepoInfo = function(req, res) {
        registry.retrieveRepository(getRepoName(req)).then(function (info) {
            processResult(res, info);
        });
    };

    router.get('/:repoId/info', handleRetrieveRepoInfo);
    router.get('/:namespace/:repoId/info', handleRetrieveRepoInfo);


    var handleListRepoImages = function(req, res) {
        registry.listRepoImages(getRepoName(req)).then(function (images) {
            processResult(res, images);
        });
    };

    router.get('/:repoId/images', handleListRepoImages);
    router.get('/:namespace/:repoId/images', handleListRepoImages);

    if (!publicRegistry) { //Private Registry Only.
        var handleRetrieveImageFromDockerHub = function(req, res) {
            dockerHub.retrieveImageFromDockerHub(getRepoName(req), req.params.imageId).then(function (image) {
                processResult(res, image);
            });
        };

        router.get('/:repoId/images/:imageId', handleRetrieveImageFromDockerHub);
        router.get('/:namespace/:repoId/images/:imageId', handleRetrieveImageFromDockerHub);

    }

    return router;
};
