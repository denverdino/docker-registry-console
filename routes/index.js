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

    privateRegistry.listTags(params.q).then(function(tags){
        var items = [];

        tags.forEach(function(imageTags) {
            for (var i = 0, len = imageTags.length; i < len; ++i) {
                var item = imageTags[i];
                items.push(item);
            }
        });
        //Sort by name and tag
        items.sort(function (a, b) {
            var result = 0;
            if (a.displayName > b.displayName) {
                result = 1;
            } else if (a.displayName < b.displayName) {
                result = -1;
            } else if (a.tag > b.tag) {
                result = 1;
            } else if (a.tag < b.tag) {
                result = -1;
            }
            return result;
        });
        res.render('index', { items: items, params: params});
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
