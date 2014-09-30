var express = require('express');
var dockerImageRegistry = require('../models/DockerImageRegistry');
var router = express.Router();

require('../utils/polyfill');

function isEmptyObject(obj) {
    return obj == null || !Object.keys(obj).length;
}

/* GET home page. */
router.get('/', function(req, res) {
    dockerImageRegistry.listTags().then(function(tags) {
        var items = [];
        tags.forEach(function(imageTags) {
            for (var i = 0, len = imageTags.length; i < len; ++i) {
                if (imageTags[i].name.startsWith('library')) {
                    imageTags[i].name = imageTags[i].name.substring('library'.length + 1)
                }
                items.push(imageTags[i]);
            }
        });
        //Sort by name and tag
        items.sort(function (a, b) {
            var result = 0;
            if (a.name > b.name) {
                result = 1;
            } else if (a.name < b.name) {
                result = -1;
            } else if (a.tag > b.tag) {
                result = 1;
            } else if (a.tag < b.tag) {
                result = -1;
            }
            return result;
        });
        return items;
    }).then(function (items) {
        res.render('index', { items: items});
    })
});

router.get('/images/:id', function(req, res) {
    dockerImageRegistry.retriveImageDetails(req.params.id).then(function(image) {
        dockerImageRegistry.retriveImageAncestry(req.params.id).then(function (layers) {
            res.render('image', {
                image: image,
                layers: layers
            });
        })
        res.render('image', {
            image: image,
            layers: layers
        });
    })
})

module.exports = router;
