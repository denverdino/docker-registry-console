var express = require('express');
var DockerImageRegistry = require('../models/DockerImageRegistry');
var router = express.Router();

require('../utils/polyfill');

//TODO Support the configuration change
var config = {
    registry: {
        host: '172.20.60.201',
        port: 5000,
        protocol: 'http',
        apiVersion: 'v1',
        cache: true
    }
};

var privateRegistry = new DockerImageRegistry(config);


function isEmptyObject(obj) {
    return obj == null || !Object.keys(obj).length;
}

/* GET home page. */
router.get('/', function(req, res) {
    //Get cached data
    var items = privateRegistry.cachedData.imageTags;

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
    res.render('index', { items: items});
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
