// A test to verify cards can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var fs = require('fs');
var Card = require('../app/Card.js');
var Canvas = require('../app/Canvas.js');
var Stack = require('../app/Stacks.js');

var app = new Application({
  path: electron,
  args: [path.join(__dirname, '..', 'main.js')],
  webPreferences: [],
});

describe('stack interactions', function () {
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

  it('creates a Stack instance', function () {
    let stack = new Stack();
    return assert.equal(stack.constructor.name, 'Stack')
  });

  it('stack contains div body, close button, expand button, ' +
  'and annotation textarea', function () {
    let stack = new Stack();
    var stackDiv = stack.stack;
    var closeButton = stack.closeButton;
    var expandButton = stack.expandButton;
    var annotation = stack.annotation;
    let msg1 = 'Document must contain stack body div.';
    let msg2 = 'Stack instance must have a close button.';
    let msg3 = 'Stack instance must have an expand button';
    let msg4 = 'Stack instance must have annotation textarea';
    assert.notEqual(stack.stack, undefined, msg1);
    assert.notEqual(stack.closeButton, undefined, msg2);
    assert.notEqual(stack.expandButton, undefined, msg3);
    assert.notEqual(stack.annotation, undefined, msg4);
  });

  it('stack instance tracks contained cards', function () {
    let stack = new Stack();
    return assert.notEqual(stack.cards, undefined);
  });

  it('stack is in collapsed state by default', function () {
    let stack = new Stack();
    return assert.equal(stack.state, 'collapsed');
  });

  it('two stack instances can be created', function () {
    let stack = new Stack();
    let stack2 = new Stack();
    return assert.notEqual(stack, stack2);
  });

  it('two stack instances contain a separate set of cards', function () {
    let stack = new Stack();
    let stack2 = new Stack();
    let card = new Card({id: 1, context: document.body, modal: false});
    stack.addCard(card);
    return assert.notEqual(stack.cards.length, stack2.cards.length);
  });

  it('cards can be removed from a stack instance', function () {
    let stack = new Stack();
    let card = new Card({id: 1, context: document.body, modal: false});
    stack.addCard(card);
    stack.removeCard();
    return assert.equal(stack.cards.length, 0);
  });

  // it('cards are positioned correctly in a stack instance', function () {
  //   let stack = new Stack();
  //   let card = new Card({id: 1, context: document.body, modal: false});
  //   stack.addCard(card);
  //   $(stack.stack).css({
  //     top: 100,
  //     left: 150,
  //   });
  //   stack.cascadeCards();
  //   let topPosition = $(stack.cards[0]).offset().top;
  //   let leftPosition = $(stack.cards[0]).offset().left;
  //   var index = 0;
  //   let idealTop = $(stack.stack).offset().top + ((index + 1) * 25) + 'px';
  //   let idealLeft = $(stack.stack).offset().left + ((index + 1) * 25) + 'px';
  //   console.log('topPosition: ' + topPosition + ' leftPosition: ' + leftPosition);
  //   console.log('idealTop: ' + idealTop + ' idealLeft: ' + idealLeft);
  //   assert.equal(topPosition, idealTop);
  //   asser.equal(leftPosition, idealLeft);
  // });
});
