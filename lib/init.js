window.$ = window.jQuery = require('jquery');
var jqueryui = require('jquery-ui');
var raphael = require('raphael');

let depLoader = require('./loader.js');

// dynamically load all CSS files in /style directory
depLoader.load('../style', '.css', function(filename) {
    let ref = document.createElement('link');
    ref.setAttribute('rel', 'stylesheet');
    ref.setAttribute('type', 'text/css');
    ref.setAttribute('href', filename);
    document.getElementsByTagName('head')[0].appendChild(ref);
});

// dynamically load all JS files in /app directory
depLoader.load('../app', '.js', function(filename) {
  let ref = document.createElement('script');
  ref.setAttribute('type', 'text/javascript');
  ref.setAttribute('src', filename);
  document.getElementsByTagName('head')[0].appendChild(ref);
});
