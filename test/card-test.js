// A test to verify a canvas is created with buttons
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var Card = require('../app/Card.js');

var app = new Application({
  path: electron,
  args: [path.join(__dirname, '..', 'main.js')],
  webPreferences: [],
});

describe('cards interactions', function () {
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

  it('creates a Card instance', function () {
    var card = new Card();
    return assert.equal(card.id, 1);
  });
});
