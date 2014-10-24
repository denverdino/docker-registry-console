'use strict';

//polyfill for ES6
require('./utils/polyfill.js');
require('es6-promise').polyfill();

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Register routes
var routes = require('./routes/index');
var resources_images = require('./routes/resources/images');
var resources_repositories = require('./routes/resources/repositories');

//var users = require('./routes/users');

app.use('/resources/registries/private/images', resources_images);
app.use('/resources/registries/private/repositories', resources_repositories(false));
app.use('/resources/registries/public/repositories', resources_repositories(true));
app.use('/', routes);

//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// helper functions used in EJS files
app.locals.isEmptyObject = function(obj) {
    return obj == null || !Object.keys(obj).length;
};

app.locals.isEmptyArray = function(array) {
    return array == null || !array.length;
};

module.exports = app;
