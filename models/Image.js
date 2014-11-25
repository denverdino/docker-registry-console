'use strict';

var Image = function(service, id) {
    this.service = service;
    this.id = id;
};

Image.prototype.info = function() {
    return this.service.GET('/images/' + this.id + '/json');
};

Image.prototype.ancestry = function() {
    return this.service.GET('/images/' + this.id + '/ancestry');
};

Image.prototype.details = function() {
    var that = this;
    return this.info().then(function(image) { //Calculate the image size
        var handler = function (layers) {
            return Promise.all(
                layers.map(function (layer) {
                    return new Image(that.service, layer).info().then(function (info) {
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
                    if (!isNaN(size)) {
                        totalSize += layers[i].size;
                    }
                    layerInfoList.push({id: id});
                }
                image.totalSize = totalSize;
                image.ancestry = layerInfoList;
                return image;
            });
        };
        return that.ancestry().then(handler, function(err) {
            return handler([]);
        })
    });
};



module.exports = Image;
