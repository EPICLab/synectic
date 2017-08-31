// A test to verify stacks can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var fs = require('fs');
var Card = require('../app/Card.js');
var Stack = require('../app/Stack.js');

describe('Stack interactions', function () {
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

  it('creates a Stack instance', function () {
    let stack = new Stack();
    return assert.equal(stack.constructor.name, 'Stack')
  });

  it('stack contains div body and annotation textarea', function () {
    let stack = new Stack();
    var stackDiv = stack.stack;
    var annotation = stack.annotation;
    let msg1 = 'Document must contain stack body div.';
    let msg2 = 'Stack instance must have annotation textarea';
    assert.notEqual(stack.stack, undefined, msg1);
    assert.notEqual(stack.annotation, undefined, msg2);
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
    let card = new Card({id: 1, type: 'text', context: document.body, modal: true});
    stack.addCard(card);
    return assert.notEqual(stack.cards.length, stack2.cards.length);
  });

  it('a new stack instance contains two cards', function () {
    let card = new Card({id: 1, type: 'text', context: document.body, modal: true});
    let card2 = new Card ({id: 2, type: 'text', context: document.body, modal: true});
    let stack = new Stack(card.card, card2.card);
    return assert.equal(stack.cards.length, 2);
  });

  it('cards can be added to a stack instance', function () {
    let card1 = new Card({id: 1, type: 'text', context: document.body, modal: true});
    let card2 = new Card({id: 2, type: 'text', context: document.body, modal: true});
    let card3 = new Card ({id: 3, type: 'text', context: document.body, modal: true});
    let stack = new Stack(card1.card, card2.card);
    stack.addCard(card3);
    return assert.equal(stack.cards.length, 3);
  });

  // it('cards are positioned correctly in a stack instance', function () {
  //   let card1 = new Card({id: 1, type: 'text', context: document.body, modal: false});
  //   let card2 = new Card({id: 2, type: 'text', context: document.body, modal: false});
  //   let stack1 = new Stack(card1.card, card2.card);
  //   $(stack1.stack).css({
  //     top: '0px',
  //     left: '0px',
  //   });
  //   let card1Position = $(stack1.cards[0]).offset();
  //   let card2Position = $(stack1.cards[1]).offset();
  //   let msg1 = 'card1 should have top value: 25px, but has top value: ' +
  //     card1Position.top;
  //   let msg2 = + 'card1 should have left value: 25px, but has left value: ' +
  //     card1Position.left;
  //   let msg3 = 'card2 should have top value: 50px, but has top value: ' +
  //     card2Position.top;
  //   let msg4 = + 'card2 should have left value: 50x, but has left value: ' +
  //     card2Position.left;
  //   assert.equal('25', card1Position.top, msg1);
  //   assert.equal('25', card1Position.left, msg2);
  //   assert.equal('50', card2Position.top, msg3);
  //   assert.equal('50', card2Position.left, msg4);
  // });

});
