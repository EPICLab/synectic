// A test to verify cards can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var fs = require('fs');
var Card = require('../app/Card.js');
var Canvas = require('../app/Canvas.js');
var TextEditor = require('../app/textEditor.js')
var SketchPad = require('../app/sketchPad.js')
var CodeEditor = require('../app/codeEditor.js')

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
    if(document.querySelector('.card') != undefined && document.querySelector('.card-header') != undefined)
      var div = 1;
    return assert.equal(div, 1);
  });

  it('document contains namebox span', function () {
    let card = new Card(1);
    if(document.querySelector('.nameBox') != undefined)
      var span = 1;
    return assert.equal(span, 1);
  });

  it('document contains close, expand, and save buttons', function () {
    let card = new Card(1);
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

  it('Card metadata updates only interaction timestamp', function () {
    var card = new Card(1);
    var createdTimestampBefore = card.createdTimestamp;
    var createdByBefore = card.createdBy;
    var lastInteractionBefore = card.lastInteraction;
    wait(10);
    card.updateMetadata();

    let msg1 = card.createdTimestamp + " == " + createdTimestampBefore +
      "\n\t(createdTimestamp should not change once Card is instantiated)";
    let msg2 = card.createdBy + " == " + createdByBefore +
      "\n\t(createdBy should not change once Card is instantiated)";
    let msg3 = card.lastInteraction + " != " + lastInteractionBefore +
      "\n\t(lastInteraction should update after Card#updateMetadata()" +
      " method is evoked)";
    assert.equal(card.createdTimestamp, createdTimestampBefore, msg1);
    assert.equal(card.createdBy, createdByBefore, msg2);
    assert.notEqual(card.lastInteraction, lastInteractionBefore, msg3);
  });

  it('creates a texteditor card instance', function () {
    let textEditor = new TextEditor(1);
    return assert.equal(textEditor.constructor.name, 'TextEditor');
  });

  it('texteditor contains three faces', function () {
    let textEditor = new TextEditor(1);
    return assert.equal(textEditor.faces.length, 3);
  });

  it('texteditor contains two \'editor\' faces', function () {
    let textEditor = new TextEditor(1);
    return assert.equal(textEditor.editors.length, 2);
  });

  it('creates a sketchpad card instance', function () {
    let sketchPad = new SketchPad(1);
    return assert.equal(sketchPad.constructor.name, 'SketchPad')
  });

  it('sketchpad contains three faces', function () {
    let sketchPad = new SketchPad(1);
    return assert.equal(sketchPad.faces.length, 3);
  });

  it('sketchpad has 4 sketch pens', function () {
    let sketchPad = new SketchPad(1);
    return assert.equal(sketchPad.pens.length, 4);
  });

  it('sketchpad has sketch pen buttons', function () {
    let sketchPad = new SketchPad(1);
    if(document.querySelector('.colorBtn') != undefined);
      var pen = 1;
    return assert.equal(pen, 1);
  });

  it('sketchpad has eraser button', function () {
    let sketchPad = new SketchPad(1);
    if(document.querySelector('.eraser') != undefined);
      var eraser = 1;
    return assert.equal(eraser, 1);
  });

  it('creates a codeEditors card instance', function () {
    let codeEditor = new CodeEditor(1);
    return assert.equal(codeEditor.constructor.name, 'CodeEditor')
  });

  it('codeeditor contains three faces', function () {
    let codeEditor = new CodeEditor(1);
    return assert.equal(codeEditor.faces.length, 3);
  });

});

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
};
