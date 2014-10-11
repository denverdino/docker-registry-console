var config = require('../../utils/config');
var DockerImageRegistry = require('../../services/DockerImageRegistry');
var dockerHub = require('../../services/DockerHub');
var express = require('express');
var url = require("url");

module.exports = function(publicRegistry) {

    var router = express.Router();

    var registry = (publicRegistry)? dockerHub : DockerImageRegistry.privateRegistry;

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

    var handleSearchRepos = function(req, res) {
        var params = url.parse(req.url, true).query;
        registry.searchRepositories(params.q).then(function (tags) {
            processResult(res, tags);
        });
    };

    router.get('/', handleSearchRepos);


    var handleListRepoTags = function(req, res) {
        registry.listRepoTags(getRepoName(req)).then(function (tags) {
            processResult(res, tags);
        });
    };

    router.get('/:repoId/tags', handleListRepoTags);
    router.get('/:namespace/:repoId/tags', handleListRepoTags);

    var handleRetrieveRepoInfo = function(req, res) {
        registry.retrieveRepoWithImages(getRepoName(req)).then(function (info) {
            processResult(res, info);
        });
    };

    router.get('/:repoId/info', handleRetrieveRepoInfo);
    router.get('/:namespace/:repoId/info', handleRetrieveRepoInfo);


    var handleListRepoImages = function(req, res) {
        registry.listRepoImagesWithTag(getRepoName(req)).then(function (images) {
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

    var handleRetrieveRepoTagsInfo = function(req, res) {
        registry.retrieveRepositoryDetails(getRepoName(req)).then(function (info) {
            processResult(res, info);
        });
    };

    router.get('/:repoId/details', handleRetrieveRepoTagsInfo);
    router.get('/:namespace/:repoId/details', handleRetrieveRepoTagsInfo);


    return router;
};
