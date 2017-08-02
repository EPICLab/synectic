// A test to verify a canvas is created with buttons
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
    var card = new Card();
    return assert.equal(card.id, 1);
  });

  it('second card has id of 2', function(){
    var card2 = new Card();
    return assert.equal(card2.id, 2);
  });

  it('nextId establishes different card id', function(){
    var card = new Card();
    var card2 = new Card();
    console.log("card id: ", card.id, "card2 id: ", card2.id);
    return assert.notEqual(card.id, card2.id);
  });

  // it('nextID recognizes that a card has been deleted', function(){
  //   var card = new Card();
  //   var closeButton = document.createElement('button');
  //   $(closeButton).click(function() {
  //     let currcard = this.closest('.card');
  //     currcard.remove();
  //   });
  //   var card2 = new Card();
  //   return assert.equal(card.id, card2.id);
  // });

  it('correctly names a card', function(){
      var card = new Card();
      console.log(card.name);
      return assert.equal(card.name, "Card: " + card.id);
    });

  it('document contains a card and header div', function(){
    var card = new Card();
    card.cardBuilder();
    if(document.querySelector('.card') != undefined && document.querySelector('.card-header') != undefined)
      var div = 1;
    return assert.equal(div, 1);
  });

  it('document contains namebox span', function(){
    var card = new Card;
    card.cardBuilder();
    if(document.querySelector('.nameBox') != undefined)
      var span = 1;
    return assert.equal(span, 1);
  });

  it('document contains close, expand, and save buttons', function(){
    var card = new Card();
    card.cardBuilder();
    if(document.querySelector('.close') != undefined && document.querySelector('.expand') != undefined && document.querySelector('.save') != undefined)
      var buttons = 1;
    return assert.equal(buttons, 1);
  });

  it('new card is not in a stack', function(){
    var card = new Card();
    return assert.equal(card.inStack, false);
  });

  it('metadata is defined', function(){
      var card = new Card();
      console.log(card.buildMetadata());
      return assert.notEqual(card.buildMetadata(), undefined);
  });

  it('metadata will update', function(){
    var card = new Card();
    var built = card.buildMetadata();
    var updated;
    setTimeout(function(){
      console.log("waiting 3 seconds");
      var updated = card.updateMetadata();
      console.log(updated);
    }, 3000);
    return assert.notEqual(built, updated);
  });

  it('card will toggle on fullScreen mode', function(){
    var card = new Card();
    var height= card.toggleFullScreen();
    var h = window.innerHeight;
    console.log('toggle hight: ', height, 'window height: ', h)
    if(height == h)
      var size = 1;
    else {
      var size = 0;
    }
    return assert.equal(size, 1);
  });

  // it('card will toggle on fullScreen mode', function(){
  //   var card = new Card();
  //   var width = card.toggleFullScreen();
  //   var w = window.innerWidth;
  //   if(width == w &&)
  //     var size = 1;
  //   return assert.equal(size, 1);
  // });

  // it('cards being draggable is enabled', function(){
  //   var card = new Card();
  //   return assert.equal(card.setDraggable, true);
  // });

  // it('if no filedata is imported, filedata should be undefined', function(){
  //   var card = new Card;
  //   card.objectCleaner(fileData);
  //   return assert.equal(card.objectCleaner(fileData), undefined);
  // });

});
