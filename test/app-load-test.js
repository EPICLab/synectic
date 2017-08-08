// A simple test to verify a visible window is opened with a title
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');

describe('application launch', function () {
  this.timeout(30000);
  var app;

  before(function () {
    app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'main.js')],
    });
    return app.start();
  });

  after(function () {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('creates an initial window', function () {
    return app.client.getWindowCount().then(function (count) {
      let msg = count + " == 1\n\t(warning: DevTools is considered a separate window, if enabled count is +1)";
      assert.equal(count, 1, msg);
    });
  });

  it('initial window is visible', function () {
    return app.browserWindow.isVisible().then(function (isVisible) {
      assert.equal(isVisible, true);
    });
  });

  it('initial window title matches package.json', function () {
    var pjson = require('../package.json');
    return app.client.getTitle().then(function (title) {
      assert.equal(title, pjson.name);
    });
  });
});
