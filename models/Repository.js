'use strict';
var Image = require('./Image');

var Repository = function(service, id) {
    this.service = service;
    this.id = id;
};

Repository.prototype.info = function() {
    return this.service.GET('/repositories/' + this.id + '/json');
};

Repository.prototype.prepareService = function(service) {
    if (!service) {
        service = this.service;
    } else {
        service.token = this.service.token; //Propagate tokens
    }
    return service;
};

Repository.prototype.tags = function(service) {
    service = this.prepareService(service);
    return service.GET('/repositories/' + this.id + '/tags');
};


Repository.prototype.images = function() {
    return this.service.GET('/repositories/' + this.id + '/images');
};

Repository.prototype.imagesWithTag = function(service) {
    var that = this;
    return this.images().then(function(images){
        service = that.prepareService(service);
        return that.tags(service).then(function (tags) {
            for (var tag in tags) {
                var value = tags[tag];
                for (var i = 0; i < images.length; i++) {
                    if (images[i].id.startsWith(value)) {
                        if (images[i].tags) {
                            images[i].tags.push(tag);
                        } else {
                            images[i].tags = [tag];
                        }
                    }
                }
            }
            return images;
        });
    });
};

Repository.prototype.tagsToList = function(tags) {
    var items = [];
    for (var name in tags) {
        var item = {
            name: name,
            id: tags[name]
        };
        items.push(item);
    }
    return items;
};


Repository.prototype.DEFAULT_NAMESPACE = 'library/';


Repository.prototype.getDisplayName = function(repoName) {
    return (repoName.startsWith(this.DEFAULT_NAMESPACE))? repoName.substring(this.DEFAULT_NAMESPACE.length) : repoName;
};

Repository.prototype.imageList = function(repo) {
    var that = this;
    return this.tags().then(function (tags) {
        var result = [];
        for (var tag in tags) {
            var image = {
                'name': that.id,
                'displayName': that.getDisplayName(that.id),
                'tag': tag,
                'id': tags[tag]
            };
            result.push(image)
        }
        return result;
    });
};

Repository.prototype.details = function(repository, service) {
    var that = this;
    if (repository) {
        return that.images().then(function (result) {
            service = that.prepareService(service);
            return that.tags(service).then(function (tags) {
                var tagList = that.tagsToList(tags);
                return Promise.all(
                    tagList.map(function (tag) {
                        return new Image(service, tag.id).details().then(function (info) {
                            info.repository = that.id;
                            info.tag = tag.name;
                            return info;
                        });
                    })
                ).then(function (tagsInfo) {
                    repository.tags = tagsInfo;
                    return repository;
                });
            });
        });
    } else {
        return null;
    }
};

module.exports = Repository;
