// A test to verify a card is created with buttons
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var fs = require('fs');
var Card = require('../app/Card.js');
var Canvas = require('../app/Canvas.js');

var app = new Application({
  path: electron,
  args: [path.join(__dirname, '..', 'main.js')],
  webPreferences: [],
});

describe('cards interactions', function () {
  this.timeout(30000);

  before(function () {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
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
    let card = new Card(1);
    return assert.equal(card.constructor.name, 'Card');
  });

  it('Card instantiation not allowed without ID', function () {
    return assert.throws(() => {
      new Card();
    }, Error );
  });

  it('correctly names a card', function () {
      let card = new Card(1);
      return assert.equal(card.name, "Card: " + card.id);
    });

    it('two cards do not have the same name', function () {
        let card = new Card(1);
        let card2 = new Card(2);
        return assert.notEqual(card.name, card2.name);
      });

  it('document contains a card and header div', function () {
    let card = new Card(1);
    card.cardBuilder();
    if(document.querySelector('.card') != undefined && document.querySelector('.card-header') != undefined)
      var div = 1;
    return assert.equal(div, 1);
  });

  it('document contains namebox span', function () {
    let card = new Card(1);
    card.cardBuilder();
    if(document.querySelector('.nameBox') != undefined)
      var span = 1;
    return assert.equal(span, 1);
  });

  it('document contains close, expand, and save buttons', function () {
    let card = new Card(1);
    card.cardBuilder();
    if(document.querySelector('.close') != undefined && document.querySelector('.expand') != undefined && document.querySelector('.save') != undefined)
      var buttons = 1;
    return assert.equal(buttons, 1);
  });

  it('new card is not in a stack', function () {
    let card = new Card(1);
    return assert.equal(card.inStack, false);
  });

  it('metadata is defined', function () {
      let card = new Card(1);
      return assert.notEqual(card.buildMetadata(), undefined);
  });

  it('metadata will update', function () {
    let card = new Card(1);
    var built = card.buildMetadata();
    var updated;
    setTimeout(function(){
      var updated = card.updateMetadata();
    }, 3000);
    return assert.notEqual(built, updated);
  });
});
