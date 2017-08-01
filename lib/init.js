window.$ = window.jQuery = require('jquery');
var raphael = require('raphael');
require('./jquery-ui.js');

let loader = require('./loader.js');
loader.loadDir('../style', '.css'); // load all CSS files in /styles
loader.loadDir('../app', '.js');   // load all JS files in /app
