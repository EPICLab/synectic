// A test to verify a card is created with buttons
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var fs = require('fs');
var Dialog = require('../app/Dialog.js');

var app = new Application({
  path: electron,
  args: [path.join(__dirname, '..', 'main.js')],
  webPreferences: [],
});

describe('Dialog interactions', function () {
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

  it('document contains div for notice dialog', function () {
    let dialog = Dialog.notice({height: '300px', width: '400px'});
    let dialogClass = document.querySelector('.dialog');
    let overlayClass = document.querySelector('.overlay');
    let closeClass = document.querySelector('.close');
    let msg1 = 'document must contain notice dialog div';
    let msg2 = 'document must contain notice overlay div';
    let msg3 = 'document must contain notice close button';
    assert.notEqual(dialogClass, undefined, msg1);
    assert.notEqual(overlayClass, undefined, msg2);
    assert.notEqual(closeClass, undefined, msg3)
  });

  // it('notice dialog overlay is removed on click', function () {
  //   let dialog = Dialog.notice({height: '300px', width: '400px'});
  //   let closeButton = document.querySelector('.close');
  //   $(closeButton).trigger('click');
  //   let overlayDiv = document.querySelector('.overlay');
  //   return assert.equal(overlayDiv, undefined);
  // });

  it('notice dialog has correct height and width', function () {
    let dialog = Dialog.notice();
    let dialogHeight = $(dialog).height();
    let dialogWidth = $(dialog).width();
    let msg1 = 'dialog height is ' + dialogHeight +' but, dialog height should be 300px';
    let msg2 = 'dialog width is ' + dialogWidth + ' but, dialog width should be 400px';
    assert.equal(dialogHeight, '300', msg1);
    assert.equal(dialogWidth, '400', msg2);
  });

  // it('document contains div for generic dialog', function () {
  //   let dialog = Dialog.dialog({height: '300px', width: '400px'});
  //   let dialogClass = document.querySelector('.dialog');
  //   let closeClass = document.querySelector('.close');
  //   let msg1 = 'document must contain notice dialog div';
  //   let msg2 = 'document must contain notice close button';
  //   assert.notEqual(dialogClass, undefined, msg1);
  //   assert.notEqual(closeClass, undefined, msg2)
  // });

  // it('generic dialog has correct height and width', function () {
  //   let dialog = Dialog.dialog();
  //   let dialogHeight = $(dialog).height();
  //   let dialogWidth = $(dialog).width();
  //   let msg1 = 'dialog height is ' + dialogHeight +' but, dialog height should be 300px';
  //   let msg2 = 'dialog width is ' + dialogWidth + ' but, dialog width should be 400px';
  //   assert.equal(dialogHeight, '300', msg1);
  //   assert.equal(dialogWidth, '400', msg2);
  // });

});
