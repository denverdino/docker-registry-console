'use strict';

var config = require('../utils/config');
var Docker = require('dockerode');
var taskService = require('./TaskService');


var DockerService = function() {
    this.client = new Docker(config.docker);
    this.queue = [];
};

DockerService.prototype.pull = function(repo, tag) {
    var imageTag = repo + ":" + tag;
    console.log('Pulling image: %s', imageTag);
    var that = this;
    return new Promise(function (resolve, reject) {
        that.client.pull(imageTag, function (error, stream) {
            if (error) {
                console.log('Failed to pull image: %s', imageTag);
                console.log(error);
                reject(error);
            } else {
                stream.on('data', that.noop);
                stream.on('error', reject);
                stream.on('end', function () {
                    console.log('Pull image %s completely!', imageTag);
                    resolve(imageTag);
                });
            }
        });
    });
};

DockerService.prototype.tag = function(repo, tag, registryHost) {
    var imageTag = repo + ":" + tag;
    console.log('Tag image: ' + imageTag);
    var params = {
        repo: registryHost + '/' + repo,
        force: 1
    };
    if (tag) {
        params.tag = tag;
    }
    var that = this;
    return new Promise(function (resolve, reject) {
        that.client.getImage(imageTag).tag(params, function(error, data) {
            if (error) {
                console.log('Failed to tag image: %s', imageTag);
                console.log(error);
                reject(error);
            } else {
                resolve(true);
            }
        });
    });
};

DockerService.prototype.noop = function(chunk) {
    if (chunk) {
        var json = JSON.parse(chunk);
        var id = json.id;
        var status = json.status;
        var line = (id) ? id + ": " + status : status;
        console.log(line);
    }
};

DockerService.prototype.push = function(repo, tag) {
    var imageTag = (tag)? repo + ":" + tag : repo;
    console.log('push image: ' + imageTag);
    var that = this;
    return new Promise(function (resolve, reject) {

        var params = {};
        if (tag) {
            params.tag = tag;
        }
        that.client.getImage(repo).push(params, function (error, stream) {
            if (error) {
                console.log('Failed to push image: %s', imageTag);
                console.log(error);
                reject(error);
            } else {
                stream.on('data', that.noop);
                stream.on('error', reject);
                stream.on('end', function () {
                    console.log('Push image %s completely!', imageTag);
                    resolve(imageTag);
                });
            }
        });
    });
};

DockerService.prototype.syncImage = function(repo, tag, registryHost) {
    var imageTag = (tag)? repo + ":" + tag : repo;
    var task = taskService.newTask("Importing " + imageTag, "running", "Pulling " + imageTag);
    var that = this;
    return this.pull(repo, tag).then(function(){
        task.update("running", "Tagging " + imageTag);
        return that.tag(repo, tag, registryHost);
    }).then(function(){
        task.update("running", "Pushing " + imageTag);
        return that.push(registryHost + "/" + repo, tag);
    }).then(function() {
        task.update("completed", "Import " + imageTag + " completed!");
    }, function (err) {
        task.update("failed", "Import " + imageTag + " failed!");
    });
};

module.exports = new DockerService();

