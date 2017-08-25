// A test to verify cards can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var fs = require('fs');
var Card = require('../app/Card.js');
var Canvas = require('../app/Canvas.js');
var Stack = require('../app/Stacks.js');
const winston = require("winston");
let logging = require("./../lib/logger");

describe('Stack interactions', function() {
  this.timeout(30000);
  var app;
  var loggers = new logging(winston);

  before(function() {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
    require('jquery-ui-bundle');

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

  it('creates a Stack instance', function() {
    let stack = new Stack();
    return assert.equal(stack.constructor.name, 'Stack')
  });

  it('stack contains div body, close button, expand button, ' +
    'and annotation textarea',
    function() {
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

  it('stack instance tracks contained cards', function() {
    let stack = new Stack();
    return assert.notEqual(stack.cards, undefined);
  });

  it('stack is in collapsed state by default', function() {
    let stack = new Stack();
    return assert.equal(stack.state, 'collapsed');
  });

  it('two stack instances can be created', function() {
    let stack = new Stack();
    let stack2 = new Stack();
    return assert.notEqual(stack, stack2);
  });

  it('two stack instances contain a separate set of cards', function() {
    let stack = new Stack();
    let stack2 = new Stack();
    let card = new Card({
      id: 1,
      type: 'text',
      context: document.body,
      logs: loggers,
      modal: true
    });
    stack.addCard(card);
    return assert.notEqual(stack.cards.length, stack2.cards.length);
  });

  it('cards can be removed from a stack instance', function() {
    let stack = new Stack();
    let card = new Card({
      id: 1,
      type: 'text',
      context: document.body,
      logs: loggers,
      modal: true
    });
    stack.addCard(card);
    stack.removeCard();
    return assert.equal(stack.cards.length, 0);
  });

  // it('cards are positioned correctly in a stack instance', function () {
  //   let stack1 = new Stack();
  //   let card1 = new Card({id: 1, type: 'text', context: document.body, modal: false});
  //   let card2 = new Card({id: 2, type: 'text', context: document.body, modal: false});
  //   $(stack1.stack).css({
  //     top: '0px',
  //     left: '0px',
  //   });
  //   stack1.addCard(card1);
  //   stack1.addCard(card2);
  //   stack1.cascadeCards();
  //   let card1Position = $(stack1.cards[0]).offset();
  //   let card2Position = $(stack1.cards[1]).offset();
  //   let msg1 = 'card1 should have top value: 25px, but has top value: ' +
  //     card1Top;
  //   let msg2 = + 'card1 should have left value: 25px, but has left value: ' +
  //     card1Left;
  //   let msg3 = 'card2 should have top value: 50px, but has top value: ' +
  //     card2Top;
  //   let msg4 = + 'card2 should have left value: 50x, but has left value: ' +
  //     card2Left;
  //   assert.equal('25px', card1Position.top(), msg1);
  //   assert.equal('25px', card1Position.left(), msg2);
  //   assert.equal('50px', card2Position.top(), msg3);
  //   assert.equal('50px', card2Position.left(), msg4);
  // });
});