// A test to verify cards can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var Card = require('../app/Card.js');

describe('cards interactions', function () {
  this.timeout(30000);
  var app;

  before(function () {
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
    var card = new Card({id: 1, context: document.body, modal: false});
    return assert.equal(card.constructor.name, 'Card');
  });

  it('Card instantiation without parameters throws Error', function () {
    return assert.throws(() => {
      new Card();
    }, Error );
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
});

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
};
