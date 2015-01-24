'use strict';

var Task = function(name, status, message) {
    this.created = new Date();
    this.name = name;
    this.update(status, message);
};

Task.prototype.update = function(status, message) {
    if (!message) {
        message = ""
    }
    this.message = message;
    this.status = status;
    this.updated = new Date();
};

module.exports = Task;




