// A test to verify a card is created with buttons
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var fs = require('fs');
var Dialog = require('../app/Dialog.js');

describe('Dialog.notice interactions', function () {
  this.timeout(30000);

  before(function () {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
    require('jquery-ui-bundle');

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

  it('creates a Dialog.notice element', function () {
    let dialog = Dialog.notice({context: document.body});
    assert(dialog instanceof HTMLDivElement);
    let dialogsOnDOM = document.getElementsByClassName('dialog');
    return assert.equal(dialogsOnDOM.length, 1);
  });

  it('Dialog.notice creation without parameters throws Error', function () {
    return assert.throws(() => {
      Dialog.notice();
    }, Error, 'Dialog.notice cannot be created without parameters');
  });

  it('Dialog.notice throws Error when missing required parameter', function () {
    return assert.throws(() => {
      Dialog.notice({height: '300px', weight: '400px'});
    }, Error, 'Dialog.notice requires \'context\' parameter during creation');
  });

  it('Dialog.notice height and width parameters are respected', function () {
    let dialog = Dialog.notice({height: '10px', width: '65px', context: document.body});
    let msgHeight = 'dialog height is ' + $(dialog).height() +', but should be 10';
    let msgWidth = 'dialog width is ' + $(dialog).width() + ', but should be 65';
    assert.equal($(dialog).height(), '10', msgHeight);
    assert.equal($(dialog).width(), '65', msgWidth);
  });

  it('Dialog.notice element is removed on close button click', function () {
    let dialogsOnDOM = document.getElementsByClassName('dialog').length;

    let dialog = Dialog.notice({context: document.body});
    let closeButton = $(dialog).children('button.close');
    $(closeButton).trigger('click');

    let msg = 'DOM contains ' + document.getElementsByClassName('dialog').length + ' dialogs after removal, but should be ' + dialogsOnDOM;
    return assert.equal(document.getElementsByClassName('dialog').length, dialogsOnDOM, msg);
  });

});

describe('Dialog.dialog interactions', function () {
  this.timeout(30000);

  before(function () {
    this.jsdom = require('jsdom-global')()
    global.$ = global.jQuery = require('jquery');
    require('jquery-ui-bundle');

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

  it('creates a Dialog.dialog element', function () {
    let dialog = Dialog.dialog({context: document.body});
    assert(dialog instanceof HTMLDivElement);
    let dialogsOnDOM = document.getElementsByClassName('dialog');
    return assert.equal(dialogsOnDOM.length, 1);
  });

  it('Dialog.dialog creation without parameters throws Error', function () {
    return assert.throws(() => {
      Dialog.dialog();
    }, Error, 'Dialog.dialog cannot be created without parameters');
  });

  it('Dialog.dialog throws Error when missing required parameter', function () {
    return assert.throws(() => {
      Dialog.notice({height: '300px', weight: '400px', modal: false});
    }, Error, 'Dialog.dialog requires \'context\' parameter during creation');
  });

  it('Dialog.dialog height and width parameters are respected', function () {
    let dialog = Dialog.dialog({height: '10px', width: '65px', context: document.body});
    let msgHeight = 'dialog height is ' + $(dialog).height() +', but should be 10';
    let msgWidth = 'dialog width is ' + $(dialog).width() + ', but should be 65';
    assert.equal($(dialog).height(), '10', msgHeight);
    assert.equal($(dialog).width(), '65', msgWidth);
  });

});
