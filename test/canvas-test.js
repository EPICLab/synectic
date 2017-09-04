// A test to verify canvases can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var Canvas = require('../app/Canvas.js');
var fs = require('fs');
const winston = require("winston");
let logging = require("../lib/logger");
var lastLine = require("last-line");

describe('canvas interactions', function() {
  this.timeout(30000);
  var app;
  var loggers;


  before(function() {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
    require('jquery-ui-bundle');
    global.loggers = new logging(winston);
    app = new Application({
      path: electron,
      args: [path.join(__dirname, '..', 'main.js')],
    });
    return app.start();
  });

  after(function() {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('creates a Canvas instance', function(done) {
    global.app = app

    setTimeout(function() {
      global.AppManager = require("./../lib/manager")
      console.log(global.AppManager)
      let canvas = new Canvas({
        id: 1
      });
      assert.equal(canvas.constructor.name, 'Canvas');
      done();
    }, 500)

  });

  it('Canvas instantiation without parameters throws Error', function(done) {
    assert.throws(() => {
      new Card();
    }, Error);
    done();
  });

  it('new Canvas instance contains no Cards', function(done) {
    let canvas = new Canvas({
      id: 1
    });
    assert.equal(canvas.cards.length, 0);
    done();
  });

  it('Canvas instance creates and tracks new Card instances', function(done) {
    let canvas = new Canvas({
      id: 1
    });
    canvas.addCard('text', true);
    canvas.addCard('text', false);
    assert.equal(canvas.cards.length, 2);
    done();
  });

  it('Canvas instance removes Card instances', function(done) {
    let canvas = new Canvas({
      id: 1
    });
    canvas.addCard('text', false);
    canvas.addCard('text', false);
    let card3 = canvas.addCard('text', false);
    assert.equal(canvas.cards.length, 3);
    canvas.removeCard({
      id: 2
    });
    assert.equal(canvas.cards.length, 2, 'Canvas did not remove Card via \'id\' field');
    canvas.removeCard({
      uuid: card3.uuid
    });
    assert.equal(canvas.cards.length, 1, 'Canvas did not remove Card via \'uuid\' field');
    done();
  });

  it('Canvas instance provides different \'id\' values to added Cards', function(done) {
    let canvas = new Canvas({
      id: 1
    });
    canvas.addCard('text', true);
    canvas.addCard('text', false);
    assert.notEqual(canvas.cards[0].id, canvas.cards[1].id);
    done();
  });

  it('Canvas instances contain different \'uuid\' field values', function(done) {
    let canvas1 = new Canvas({
      id: 1
    });
    let canvas2 = new Canvas({
      id: 2
    });
    assert.notEqual(canvas1.uuid, canvas2.uuid);
    done();
  });

  it('Canvas instances contain different sets of Cards', function(done) {
    let canvas1 = new Canvas({
      id: 1
    });
    let canvas2 = new Canvas({
      id: 2
    });
    canvas1.addCard('text', false);
    assert.notEqual(canvas1.cards.length, canvas2.cards.length);
    done();
  });

  it("Canvas creations should to canvasCreations.log file", function(done) {
    let uuid;
    var canvas;
    let l = fs.watch(path.join(__dirname, '../logs', "canvasCreations.log"), function(eventType, fileName) {
      lastLine(path.join(__dirname, '../logs', fileName), function(err, res) {
        res = JSON.parse(res).message.split(" ")[1] // get UUID of canvas
        res = res.replace(/['"]+/g, '')
        canvas.uuid = canvas.uuid.replace(/['"]+/g, '')
        assert.equal(res, canvas.uuid);
        done();
        l.close(); // needed to unwatch file for future testing
      });
    });
    setTimeout(function() {
      canvas = new Canvas({
        id: 1
      });
    }, 3000)
  });


  // it("Canvas resizes should log events to canvasResizes.log file", function(done) {
  //   let last1;
  //   lastLine(path.join(__dirname, '../logs', "canvasResizes.log"), function(err, res) {
  //     last1 = res;
  //   });

  //   app.browserWindow.setSize(200, 222);
  //   let canvas5 = new Canvas({
  //     id: 5
  //   });
  //   let uuid;
  //   let l = fs.watch(path.join(__dirname, '../logs', "canvasResizes.log"), function(eventType, fileName) {
  //     setTimeout(function() {
  //       lastLine(path.join(__dirname, '../logs', fileName), function(err, res) {
  //         assert.notEqual(last1, res);
  //         done();
  //         l.close(); // needed to unwatch file for future testing
  //       });
  //     }, 4000);
  //   });
  // }); // weak test that only tests to see if a new log was generated. 

});