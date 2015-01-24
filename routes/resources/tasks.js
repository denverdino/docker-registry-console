'use strict';

//var config = require('../../utils/config');
var taskService = require('../../services/TaskService');
var express = require('express');
var url = require("url");
var view = require('../../utils/view');

var router = express.Router();

router.get('/', function(req, res) {
    view.renderJSON(res, taskService.queue);
});

module.exports = router;
