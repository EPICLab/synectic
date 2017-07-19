// A simple test to verify a visible window is opened with a title
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');

var app = new Application({
  path: electron,
  args: [path.join(__dirname, '..', 'main.js')],
  webPreferences: [],
});

describe('application launch', function () {
  this.timeout(10000);

  beforeEach(function () {
    this.app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'main.js')],
    });
    return this.app.start();
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('shows an initial window', function () {
    this.app.webContents.closeDevTools();
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1);
    });
  });

  it('initial window is visible', function () {
    return this.app.browserWindow.isVisible().then(function (isVisible) {
      assert.equal(isVisible, true);
    });
  });

  it('initial window title matches package.json', function () {
    var pjson = require('../package.json');
    return this.app.client.getTitle().then(function (title) {
      assert.equal(title, pjson.name);
    });
  });
});
