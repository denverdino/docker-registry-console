//var config = require('../../utils/config');
var DockerImageRegistry = require('../../services/DockerImageRegistry');
var express = require('express');
var url = require("url");

var router = express.Router();

var privateRegistry = DockerImageRegistry.privateRegistry;

router.get('/', function(req, res) {
    var params = url.parse(req.url, true).query;
    privateRegistry.searchRepoImagesWithTag(params.q).then(function(items){
        console.log(items);
        res.json(items);
    });

});

module.exports = router;
