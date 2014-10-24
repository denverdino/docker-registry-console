"use strict";

var menu = require('./config').menu;

var View = function() {
};

View.prototype.renderJSONError = function(res, err) {
    console.log(err.message);
    console.log(err.stack);
    res.status(500).send({
        message: 'Internal Error',
        type:'internal',
        stack: err.stack}
    );
};

//Common handler for JSON result
View.prototype.renderJSONPromise = function(res, promise) {
    var that = this;
    promise.then(function (result) {
        that.renderJSON(res, result);
    }, function (err) {
        that.renderJSONError(res, err);
    });
};

View.prototype.renderJSON = function(res, result) {
    if (result) {
        res.json(result);
    } else {
        res.status(404).send('Not found');
    }
};

View.prototype.render = function(req, res, view, params) {
    if (!params) {
        params = {};
    }
    params.menu = menu;
    params.requestUrl = req.url;
    res.render(view, params);
};

module.exports = new View();