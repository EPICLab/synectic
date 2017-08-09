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

describe('cards interactions', function () {
  this.timeout(30000);
  var app;

  before(function () {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
      app = new Application({      path: electron,
      args: [path.join(__dirname, '..', 'main.js')],
    });
    return app.start();
  });

  after(function () {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('creates a Card instance', function () {
    var card = new Card({id: 1, context: document.body, modal: false});
    return assert.equal(card.constructor.name, 'Card');
  });

  it('Card instantiation without parameters throws Error', function () {
    return assert.throws(() => {
      new Card();
    }, Error );
  });

  it('correctly names a card', function () {
      let card = new Card({id: 1, context: document.body, modal: false});
      return assert.equal(card.name, "My Card " + card.id);
    });

  it('two cards do not have the same name', function () {
      let card = new Card({id: 1, context: document.body, modal: false});
      let card2 = new Card({id: 2, context: document.body, modal: false});
      return assert.notEqual(card.name, card2.name);
  });

  it('document contains a card and header div', function () {
    let card = new Card({id: 1, context: document.body, modal: false});
    let cardClass = document.querySelector('.card');
    let cardHeaderClass = document.querySelector('.card-header');
    let msg1 = 'document contains card div';
    let msg2 = 'document contains header div'
    assert.notEqual(cardClass, undefined, msg1);
    assert.notEqual(cardHeaderClass, undefined, msg2);
  });

  it('document contains namebox span', function () {
    let card = new Card({id: 1, context: document.body, modal: false});
    if(document.querySelector('.card-title') != undefined)
      var span = 1;
    return assert.equal(span, 1);
  });

  it('document contains close, expand, and save buttons', function () {
    let card = new Card({id: 1, context: document.body, modal: false});
    let closeButton = document.querySelector('.close');
    let expandButton = document.querySelector('.expand');
    let saveButton = document.querySelector('.save');
    let msg1 = 'document contains close button';
    let msg2 = 'document contains expand button';
    let msg3 = 'document contains save button';
    assert.notEqual(closeButton, undefined, msg1);
    assert.notEqual(expandButton, undefined, msg2);
    assert.notEqual(saveButton, undefined, msg3);
  });

  it('new card is not in a stack', function () {
    let card = new Card({id: 1, context: document.body, modal: false});
    return assert.equal(card.inStack, false);
  });

  it('Card instantiation without \'id\' parameter throws Error', function () {
    return assert.throws(() => {
      new Card({context: document.body, modal: false});
    }, Error );
  });

  it('Card instantiation without \'context\' parameter throws Error', function () {
    return assert.throws(() => {
      new Card({id: 1, modal: false});
    }, Error );
  });

  it('Card metadata updates only interaction timestamp', function () {
    var card = new Card({id: 1, context: document.body, modal: false});
    var createdTimestampBefore = card.createdTimestamp;
    var createdByBefore = card.createdBy;
    var lastInteractionBefore = card.lastInteraction;

    let msg1 = card.createdTimestamp + " == " + createdTimestampBefore +
      "\n\t(createdTimestamp should not change once Card is instantiated)";
    let msg2 = card.createdBy + " == " + createdByBefore +
      "\n\t(createdBy should not change once Card is instantiated)";
    assert.equal(card.createdTimestamp, createdTimestampBefore, msg1);
    assert.equal(card.createdBy, createdByBefore, msg2);
  });

  it('metadata will update', function () {
    let card = new Card({id: 1, context: document.body, modal: false});
    var built = card.buildMetadata();
    var updated;
    setTimeout(function(){
      var updated = card.updateMetadata();
    }, 3000);
    return assert.notEqual(built, updated);
  });

  it('creates a texteditor card instance', function () {
    let textEditor = new TextEditor({id: 1, context: document.body, modal: false});
    return assert.equal(textEditor.constructor.name, 'TextEditor');
  });

  it('texteditor contains three faces', function () {
    let textEditor = new TextEditor({id: 1, context: document.body, modal: false});
    return assert.equal(textEditor.faces.length, 3);
  });

  it('texteditor contains two \'editor\' faces', function () {
    let textEditor = new TextEditor({id: 1, context: document.body, modal: false});
    return assert.equal(textEditor.editors.length, 2);
  });

  it('creates a sketchpad card instance', function () {
    let sketchPad = new SketchPad({id: 1, context: document.body, modal: false});
    return assert.equal(sketchPad.constructor.name, 'SketchPad')
  });

  it('sketchpad contains three faces', function () {
    let sketchPad = new SketchPad({id: 1, context: document.body, modal: false});
    return assert.equal(sketchPad.faces.length, 3);
  });

  it('sketchpad has 4 sketch pens', function () {
    let sketchPad = new SketchPad({id: 1, context: document.body, modal: false});
    return assert.equal(sketchPad.pens.length, 4);
  });

  it('sketchpad has sketch pen buttons', function () {
    let sketchPad = new SketchPad({id: 1, context: document.body, modal: false});
    if(document.querySelector('.colorBtn') != undefined);
      var pen = 1;
    return assert.equal(pen, 1);
  });

  it('sketchpad has eraser button', function () {
    let sketchPad = new SketchPad({id: 1, context: document.body, modal: false});
    if(document.querySelector('.eraser') != undefined);
      var eraser = 1;
    return assert.equal(eraser, 1);
  });

  it('creates a codeEditors card instance', function () {
    let codeEditor = new CodeEditor({id: 1, context: document.body, modal: false});
    return assert.equal(codeEditor.constructor.name, 'CodeEditor')
  });

  it('codeeditor contains three faces', function () {
    let codeEditor = new CodeEditor({id: 1, context: document.body, modal: false});
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
