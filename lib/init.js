// load global libraries required for Electron to properly use them
window.$ = window.jQuery = require('jquery');
var raphael = require('raphael');
require('jquery-ui-bundle');
let {
  exec
} = require("child_process")
require("./loadServer")()
const {
  Menu
} = require('electron').remote;
// load application-specific CSS and JS files, plus jQuery-UI minimized files
let loader = require('./loader.js');
const logging = require("./../lib/logger");
const winston = require("winston")
const loggers = new logging(winston);

loader.loadDir('../style', {
  filter: '.css'
});
// loader.loadDir('../app', {filter: '.js'});

// load Application Menu and an initial Canvas instance
let AppManager = require('../lib/manager.js');
AppManager.addCanvas();