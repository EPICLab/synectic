// A test to verify a canvas is created with buttons
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var Canvas = require('../app/Canvas.js');

var app = new Application({
  path: electron,
  args: [path.join(__dirname, '..', 'main.js')],
  webPreferences: [],
});

describe('canvas interactions', function () {
  this.timeout(30000);

  before(function () {
    this.app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'main.js')],
    });
    return this.app.start();
  });

  after(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('creates a Canvas instance', function () {
    var canvas = new Canvas();
    return assert.equal(canvas.counter, 3);
  });

  it('increments a Canvas counter', function () {
    var canvas = new Canvas();
    canvas.incCounter();
    return assert.equal(canvas.counter, 4);
  });

  it('two Canvas instances contain different counters', function () {
    var canvas1 = new Canvas();
    var canvas2 = new Canvas();
    canvas1.incCounter();
    return assert.notEqual(canvas1.counter, canvas2.counter);
  });
});
