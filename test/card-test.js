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

  it('creates a Card instance', function () {
    let card = new Card({id: 1, type: 'text', context: document.body, modal: true});
    assert(card instanceof Card);
    return assert.equal(card.constructor.name, 'Card');
  });

  it('Card instantiation without parameters throws Error', function () {
    return assert.throws(() => {
      new Canvas();
    }, Error, 'Card cannot be instantiated without parameters');
  });

  it('Card instantiation throws Error when missing required parameters', function () {
    assert.throws(() => {
      new Card({type: 'text', context: document.body, modal: true});
    }, Error, 'Card requires \'id\' parameter during instantiation');

    assert.throws(() => {
      new Card({id: 1, context: document.body, modal: true});
    }, Error, 'Card requires \'type\' parameter during instantiation');

    assert.throws(() => {
      new Card({id: 1, type: 'text', modal: true});
    }, Error, 'Card requires \'context\' parameter during instantiation');
  });

  it('Card instantiation does not throw Error when missing optional parameters', function () {
    return assert.doesNotThrow(() => {
      new Card({id: 1, type: 'text', context: document.body});
    }, Error);
  });

  it('Card instances contain different \'uuid\' field values', function () {
      let card = new Card({id: 1, type: 'text', context: document.body, modal: true});
      let card2 = new Card({id: 2, type: 'text', context: document.body, modal: true});
      return assert.notEqual(card.uuid, card2.uuid);
  });

  it('document contains a card and header div', function () {
    let card = new Card({id: 1, type: 'text', context: document.body, modal: true});
    let msg1 = card.card + ' document contains card div';
    let msg2 = card.header + ' document contains header div'
    assert.notEqual(card.card, undefined, msg1);
    assert.notEqual(card.header, undefined, msg2);
  });

  it('document contains namebox span', function () {
    let card = new Card({id: 1, type: 'text', context: document.body, modal: true});
    assert.notEqual(card.title, undefined);
  });

  it('Card interactions cause only interaction timestamp metadata to update', function () {
    var card = new Card({id: 1, type: 'text', context: document.body, modal: true});
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
      "\n\t(lastInteraction should update after Card.updateMetadata()" +
      " method is evoked)";
    assert.equal(card.createdTimestamp, createdTimestampBefore, msg1);
    assert.equal(card.createdBy, createdByBefore, msg2);
    assert.notEqual(card.lastInteraction, lastInteractionBefore, msg3);
  });

  // it('card intance has correct height and width when fullscreen mode is toggled on', function () {
  //   let card = new Card({id: 1, type: 'text', context: document.body, modal: true});
  //   card.toggleButton.trigger('click');
  //   var curHeight = card.offsetHeight;
  //   var curWdith = card.offsetWidth;
  //   var idealHeight = document.offsetHeight;
  //   var idealWidth = document.offsetWidth;
  //   let msg1 = 'current height of card is: ' + curHeight + ' but, ideal height is: ' + idealHeight;
  //   let msg2 = 'current widtht of card is: ' + curWidth + ' but, ideal width is: ' + idealWidth;
  //   assert.equal(idealHeight, curHeight);
  //   assert.equal(idealWidth, curWidth);
  // });

  it('creates a texteditor card instance', function () {
    let textEditor = new TextEditor({id: 1, type: 'text', context: document.body, modal: true});
    return assert.equal(textEditor.constructor.name, 'TextEditor');
  });

  it('texteditor contains three faces', function () {
    let textEditor = new TextEditor({id: 1, type: 'text', context: document.body, modal: true});
    return assert.equal(textEditor.faces.length, 3);
  });

  it('texteditor contains two \'editor\' faces', function () {
    let textEditor = new TextEditor({id: 1, type: 'text', context: document.body, modal: true});
    return assert.equal(textEditor.editors.length, 2);
  });

  it('creates a sketchpad card instance', function () {
    let sketchPad = new SketchPad({id: 1, type: 'sketch', context: document.body, modal: true});
    return assert.equal(sketchPad.constructor.name, 'SketchPad')
  });

  it('sketchpad contains three faces', function () {
    let sketchPad = new SketchPad({id: 1, type: 'sketch', context: document.body, modal: true});
    return assert.equal(sketchPad.faces.length, 3);
  });

  it('sketchpad has sketch pen buttons', function () {
    let sketchPad = new SketchPad({id: 1, type: 'sketch', context: document.body, modal: true});
    assert.notEqual(sketchPad.pens, undefined);
  });

  // it('sketchpad has 4 sketch pens', function () {
  //   let sketchPad = new SketchPad({id: 1, context: document.body, modal: false});
  //   return assert.equal(sketchPad.pens.length, 4);
  // });

  // it('sketchpad has eraser button', function () {
  //   let sketchPad = new SketchPad({id: 1, context: document.body, modal: false});
  //   return assert.notEqual(sketchPad.eraser, undefined);
  // });

  it('creates a codeEditors card instance', function () {
    let codeEditor = new CodeEditor({id: 1, type: 'editor', context: document.body, modal: true});
    return assert.equal(codeEditor.constructor.name, 'CodeEditor')
  });

  it('codeEditor contains three faces', function () {
    let codeEditor = new CodeEditor({id: 1, type: 'editor', context: document.body, modal: true});
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
