'use strict';

require('../utils/polyfill');

var http = require("http");
var url = require("url");
var express = require('express');
var DockerImageRegistry = require('../services/DockerImageRegistry');
var router = express.Router();
var view = require('../utils/view');
var config = require('../utils/config');




/* GET home page. */
router.get('/templates/sidebar.html', function(req, res) {
    view.render(req, res, 'templates/sidebar', {config: config});
});


module.exports = router;
