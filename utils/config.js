"use strict";

var configLoader = require('./configLoader');
var config = configLoader(process.env);
module.exports = config;