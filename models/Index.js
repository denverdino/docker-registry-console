'use strict';

var request = require('request');
var Repository = require('./Repository');
var Image = require('./Image');

var Index = function(service) {
    this.service = service;
};

Index.prototype.listRepositories = function() {
    return this.searchRepositories(null);
};

Index.prototype.searchRepositories = function(query) {
    var queryString =  (query)? 'q=' + encodeURIComponent(query) : '';
    return this.service.GET('/search', queryString).then(function(result) {
        return result.results;
    });
};

Index.prototype.DEFAULT_NAMESPACE = 'library/';


Index.prototype.getRepoNameWithNS = function(repoName) {
    return (repoName.indexOf('/') >= 0)? repoName : this.DEFAULT_NAMESPACE + repoName;
};


Index.prototype.retrieveRepository = function(repoName) {
    var that = this;
    return this.searchRepositories(repoName).then(function(repositories){
        var result = null;
        repoName = that.getRepoNameWithNS(repoName);
        for (var i = 0; i < repositories.length; i++) {
            var name = that.getRepoNameWithNS(repositories[i].name);
            if (repoName == name) { //Found
                result = repositories[i];
                break;
            }
        }
        return result; //Not found
    });
};


Index.prototype._searchRepoImagesWithTag = function(query) {
    var that = this;
    return this.searchRepositories(query).then(function(repositories) {
        if (repositories.length == 0) {
            return []
        } else {
            return Promise.all(
                repositories.map(function (repo) {
                    return new Repository(that.service, repo.name).imageList();
                })
            ).then(function(imageLists) {
                var items = [];

                imageLists.forEach(function (imageLists) {
                    for (var i = 0, len = imageLists.length; i < len; ++i) {
                        var item = imageLists[i];
                        items.push(item);
                    }
                });
                return items;
            });
        }
    });
};

Index.prototype.searchRepoImagesWithTag = function(query) {
    var that = this;
    return this._searchRepoImagesWithTag(query).then(function(images) {
        if (images.length == 0) {
            return [];
        } else {
            return Promise.all(
                images.map(function (image) {
                    return new Image(that.service, image.id).info().then(function(info) {
                        //Object.assign(image, info);
                        image.created = info.created;
                        return image;
                    });
                })
            );
        }
    }).then(function (images) {
        //Sort by name and tag
        images.sort(function (a, b) {
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
        return images;
    });
};

Index.prototype.buildIndex = function() {
    var that = this;
    return this._searchRepoImagesWithTag().then(function(imageTags){
        var result = {
            imageTagIndex: {}
        };
        var imageTagIndex = result.imageTagIndex;

        for (var i = 0, len = imageTags.length; i < len; ++i) {
            var item = imageTags[i];
            if (item.tag) {
                var value = imageTagIndex[item.id];
                if (value) {
                    value.push(item);
                } else {
                    imageTagIndex[item.id] = [item];
                }
            }
        }

        console.log("Refresh layer index completed!");
        return result;
    });
};

module.exports = Index;
