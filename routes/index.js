require('../utils/polyfill');

var config = require('../utils/config');

var http = require("http");
var url = require("url");
var express = require('express');
var DockerImageRegistry = require('../models/DockerImageRegistry');
var router = express.Router();

var privateRegistry = new DockerImageRegistry(config.registry);

//var dockerHub = new DockerImageRegistry(config.dockerHub);
//
//dockerHub.searchImages('centos').then(function(images){
//    console.log(images);
//});


function isEmptyObject(obj) {
    return obj == null || !Object.keys(obj).length;
}

/* GET home page. */
router.get('/', function(req, res) {
    var params = url.parse(req.url, true).query;

    privateRegistry.listImageTags(params.q).then(function(items){
        res.render('home', { items: items, params: params});
    });


});

router.get('/images/:id', function(req, res) {
    privateRegistry.retrieveImageDetails(req.params.id).then(function(image) {
        privateRegistry.retrieveImageAncestry(req.params.id).then(function (layers) {
            var layerInfoList = [];
            layers.forEach(function(layer){
                var displayName = null;
                var imageInfo = privateRegistry.cachedData.tagIndex[layer];
                if (imageInfo) {
                    displayName = imageInfo.name + ':' + imageInfo.tag;
                }
                layerInfoList.push({id: layer, displayName: displayName})
            });
            res.render('image', {
                image: image,
                layers: layerInfoList
            });
        })
    })
});


module.exports = router;
