var config = require('../../utils/config');
var DockerImageRegistry = require('../../models/DockerImageRegistry');
var express = require('express');
var url = require("url");

var router = express.Router();

var privateRegistry = new DockerImageRegistry(config.registry);

router.get('/', function(req, res) {
    var params = url.parse(req.url, true).query;

    privateRegistry.searchRepoImagesWithTag(params.q).then(function(items){
        res.json(items);
    });

});

module.exports = router;
