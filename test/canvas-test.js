// A test to verify canvases can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var Canvas = require('../app/Canvas.js');

describe('canvas interactions', function () {
  this.timeout(30000);
  var app;

  before(function () {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
    require('jquery-ui-bundle');

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
    let canvas = new Canvas({id: 1});
    return assert.equal(canvas.constructor.name, 'Canvas');
  });

  it('Canvas instantiation without parameters throws Error', function () {
    return assert.throws(() => {
      new Card();
    }, Error);
  });

  it('new Canvas instance contains no Cards', function () {
    let canvas = new Canvas({id: 1});
    return assert.equal(canvas.cards.length, 0);
  });

  it('Canvas instance creates and tracks new Card instances', function () {
    let canvas = new Canvas({id: 1});
    canvas.addCard('text', true);
    canvas.addCard('text', false);
    return assert.equal(canvas.cards.length, 2);
  });

  it('Canvas instance removes Card instances', function () {
    let canvas = new Canvas({id: 1});
    canvas.addCard('text', false);
    canvas.addCard('text', false);
    let card3 = canvas.addCard('text', false);
    assert.equal(canvas.cards.length, 3);
    canvas.removeCard({id: 2});
    assert.equal(canvas.cards.length, 2, 'Canvas did not remove Card via \'id\' field');
    canvas.removeCard({uuid: card3.uuid});
    assert.equal(canvas.cards.length, 1, 'Canvas did not remove Card via \'uuid\' field');
  });

  it('Canvas instance provides different \'id\' values to added Cards', function () {
    let canvas = new Canvas({id: 1});
    canvas.addCard('text', true);
    canvas.addCard('text', false);
    return assert.notEqual(canvas.cards[0].id, canvas.cards[1].id);
  });

  it('Canvas instances contain different \'uuid\' field values', function () {
    let canvas1 = new Canvas({id: 1});
    let canvas2 = new Canvas({id: 2});
    return assert.notEqual(canvas1.uuid, canvas2.uuid);
  });

  it('Canvas instances contain different sets of Cards', function () {
    let canvas1 = new Canvas({id: 1});
    let canvas2 = new Canvas({id: 2});
    canvas1.addCard('text', false);
    return assert.notEqual(canvas1.cards.length, canvas2.cards.length);
  });

});
