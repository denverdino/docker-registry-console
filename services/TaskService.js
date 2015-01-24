'use strict';


var Task = require('../models/Task');

var TaskService = function() {
    this.queue = [];
    this.newTask("test", "test", "Just for testing");
    this.newTask("running", "running", "Just for testing2");
    this.newTask("completed", "completed", "Just for testing2");
    this.newTask("failed", "failed", "Just for testing2");

};

TaskService.prototype.newTask = function(name, status, message) {
    var task = new Task(name, status, message);
    this.queue.push(task);
    return task;
};

TaskService.prototype.deleteTask = function(task) {
    for(var i = this.queue.length-1; i >= 0; i--){
        if (this.queue[i] == task) {
            this.queue.splice(i,1);
            return true;
        }
    }
    return false;
};

module.exports = new TaskService();




