'use strict';

require('../utils/polyfill');

var http = require("http");
var url = require("url");
var express = require('express');
var DockerImageRegistry = require('../services/DockerImageRegistry');
var router = express.Router();
var view = require('../utils/view');



var privateRegistry = DockerImageRegistry.privateRegistry;


/* GET home page. */
router.get('/', function(req, res) {
    res.redirect('/private_registry');
});


/* GET home page. */
router.get('/private_registry', function(req, res) {
    var params = url.parse(req.url, true).query;
    view.render(req, res, 'home', { params: params});
});


var getLayerDisplayName = function(layer) {
    var displayName = null;
    var images = privateRegistry.cachedData.imageTagIndex[layer];
    if (images) {
        displayName = '';
        for (var i = 0; i < images.length; i++) {
            if (i > 0) {
                displayName += ', '
            }
            displayName += images[i].displayName + ':' + images[i].tag;
        }
    }
    return displayName;
};

/* GET image details from private registry. */
router.get('/private_registry/images/:id', function(req, res) {
    privateRegistry.retrieveImageDetails(req.params.id).then(function(image) {
        privateRegistry.retrieveImageAncestry(req.params.id).then(function (layers) {
            return Promise.all(
                layers.map(function (layer) {
                    return privateRegistry.retrieveImageDetails(layer).then(function (info) {
                        var result = {
                            id: info.id,
                            size: info.Size
                        };
                        return result;
                    });
                })
            ).then(function(layers) {
                var totalSize = 0;
                var layerInfoList = [];
                for (var i = 0, len = layers.length; i<len; i++) {
                    var id = layers[i].id;
                    var size = layers[i].size;
                    if (size) {
                        totalSize += layers[i].size;
                    }
                    layerInfoList.push({id: id, displayName: getLayerDisplayName(id)});
                }
                image.totalSize = totalSize;
                var params = url.parse(req.url, true).query;
                view.render(req, res, 'image', {
                    image: image,
                    layers: layerInfoList,
                    params: params
                });
            });
        })
    })
});


/* GET docker hub page. */
router.get('/docker_hub', function(req, res) {
    var params = url.parse(req.url, true).query;
    view.render(req, res, 'docker_hub', { params: params});
});


var getRepoName = function(req) {
    return (req.params.namespace)? req.params.namespace + '/' + req.params.repoId: req.params.repoId;
};

var handleRetrieveRepoInfo = function(req, res) {
    var repoName = getRepoName(req);
    view.render(req, res, 'docker_hub_repositories', {
        repoName: repoName
    });
};

/* GET image details from private registry. */
router.get('/docker_hub/repositories/:repoId', handleRetrieveRepoInfo);
router.get('/docker_hub/repositories/:namespace/:repoId', handleRetrieveRepoInfo);


module.exports = router;
