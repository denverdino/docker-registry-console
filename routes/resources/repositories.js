var config = require('../../utils/config');
var DockerImageRegistry = require('../../services/DockerImageRegistry');
var dockerHub = require('../../services/DockerHub');
var express = require('express');
var url = require("url");
var view = require('../../utils/view');

module.exports = function(publicRegistry) {

    var router = express.Router();

    var registry = (publicRegistry)? dockerHub : DockerImageRegistry.privateRegistry;

    var getRepoName = function(req) {
        return (req.params.namespace)? req.params.namespace + '/' + req.params.repoId: req.params.repoId;
    };

    var handleSearchRepos = function(req, res) {
        var params = url.parse(req.url, true).query;
        view.renderJSONPromise(res, registry.searchRepositories(params.q));
    };

    router.get('/', handleSearchRepos);


    var handleListRepoTags = function(req, res) {
        view.renderJSONPromise(res, registry.listRepoTags(getRepoName(req)));
    };

    router.get('/:repoId/tags', handleListRepoTags);
    router.get('/:namespace/:repoId/tags', handleListRepoTags);

    var handleRetrieveRepoInfo = function(req, res) {
        view.renderJSONPromise(res, registry.retrieveRepoWithImages(getRepoName(req)));
    }

    router.get('/:repoId/info', handleRetrieveRepoInfo);
    router.get('/:namespace/:repoId/info', handleRetrieveRepoInfo);


    var handleListRepoImages = function(req, res) {
        view.renderJSONPromise(res, registry.listRepoImagesWithTag(getRepoName(req)));
    };

    router.get('/:repoId/images', handleListRepoImages);
    router.get('/:namespace/:repoId/images', handleListRepoImages);

    if (!publicRegistry) { //Private Registry Only.
        var handleRetrieveImageFromDockerHub = function(req, res) {
            view.renderJSONPromise(res, dockerHub.retrieveImageFromDockerHub(getRepoName(req), req.params.imageId));
        };

        router.get('/:repoId/images/:imageId', handleRetrieveImageFromDockerHub);
        router.get('/:namespace/:repoId/images/:imageId', handleRetrieveImageFromDockerHub);

    }

    var handleRetrieveRepoTagsInfo = function(req, res) {
        view.renderJSONPromise(res, registry.retrieveRepositoryDetails(getRepoName(req)));
    };

    router.get('/:repoId/details', handleRetrieveRepoTagsInfo);
    router.get('/:namespace/:repoId/details', handleRetrieveRepoTagsInfo);


    return router;
};
