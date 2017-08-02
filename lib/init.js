window.$ = window.jQuery = require('jquery');
var raphael = require('raphael');

let loader = require('./loader.js');
loader.loadDir('../style', '.css'); // load all CSS files in /styles
loader.loadDir('../app', '.js');   // load all JS files in /app
loader.loadFile('../lib/jquery-ui-1.12.1/jquery-ui.min.css');
loader.loadFile('../lib/jquery-ui-1.12.1/jquery-ui.min.js');
