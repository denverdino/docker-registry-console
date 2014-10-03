var express = require('express');
var dockerImageRegistry = require('../models/DockerImageRegistry');
var router = express.Router();

require('../utils/polyfill');

function isEmptyObject(obj) {
    return obj == null || !Object.keys(obj).length;
}

/* GET home page. */
router.get('/', function(req, res) {
    //Get cached data
    var items = dockerImageRegistry.cachedData.imageTags;

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
    dockerImageRegistry.retriveImageDetails(req.params.id).then(function(image) {
        dockerImageRegistry.retriveImageAncestry(req.params.id).then(function (layers) {
            var layerInfoList = [];
            layers.forEach(function(layer){
                var displayName = null;
                var imageInfo = dockerImageRegistry.cachedData.tagIndex[layer];
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


// timers to build the in-memory index of images every minutes
dockerImageRegistry.buildIndex();

setInterval(function(){
    dockerImageRegistry.buildIndex();
}, 60000);

module.exports = router;
