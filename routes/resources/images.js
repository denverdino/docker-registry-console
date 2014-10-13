//var config = require('../../utils/config');
var DockerImageRegistry = require('../../services/DockerImageRegistry');
var express = require('express');
var url = require("url");
var view = require('../../utils/view');

var router = express.Router();

var privateRegistry = DockerImageRegistry.privateRegistry;

router.get('/', function(req, res) {
    var params = url.parse(req.url, true).query;
    view.renderJSONPromise(res, privateRegistry.searchRepoImagesWithTag(params.q));
});

module.exports = router;
