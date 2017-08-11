// A test to verify canvases can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var Canvas = require('../app/Canvas.js');

global.before(function () {
  // this.jsdom = require('jsdom-global')();
  global.$ = global.jQuery = require('jquery');
});

describe('canvas interactions', function () {
  this.timeout(30000);
  var app;

  before(function () {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
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

  it('creates a Canvas instance', function () {
    let canvas = new Canvas();
    return assert.equal(canvas.constructor.name, 'Canvas');
  });

  it('new Canvas instance has no cards', function () {
    let canvas = new Canvas();
    return assert.equal(canvas.cards.length, 0);
  });

  it('added cards are tracked by Canvas instance', function () {
    let canvas = new Canvas();
    canvas.addCard('text', false);
    canvas.addCard('text', false);
    return assert.equal(canvas.cards.length, 2);
  });

  it('each added card receives different ID in a Canvas instance', function () {
    let canvas = new Canvas();
    canvas.addCard('text', false);
    canvas.addCard('text', false);
    return assert.notEqual(canvas.cards[0].id, canvas.cards[1].id);
  });

  it('two Canvas instances contain a separate set of cards', function () {
    let canvas1 = new Canvas();
    let canvas2 = new Canvas();
    canvas1.addCard('text', false);
    return assert.notEqual(canvas1.cards.length, canvas2.cards.length);
  });

  // it('removed card is tracked by canvas instance', function () {
  //   let canvas = new Canvas();
  //   canvas.addCard('text', false);
  //   canvas.removeCard();
  //   return assert.equal(canvas.cards.length, 0);
  // });

  // it('canvas instance correctly tracks added and removed cards', function () {
  //   let canvas = new Canvas();
  //   canvas.addCard('text', false);
  //   canvas.addCard('text', false);
  //   canvas.removeCard();
  //   canvas.addCard('text', false);
  //   return assert.equal(canvas.cards.length, 2);
  // });
});
