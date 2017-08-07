// A test to verify cards can be created and interacted
var Application = require('spectron').Application;
var electron = require('electron-prebuilt');
var assert = require('assert');
const path = require('path');
var Card = require('../app/Card.js');

var app = new Application({
  path: electron,
  args: [path.join(__dirname, '..', 'main.js')],
  webPreferences: [],
});

describe('cards interactions', function () {
  this.timeout(30000);

  before(function () {
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
    var card = new Card(1);
    return assert.equal(card.constructor.name, 'Card');
  });

  it('Card instantiation not allowed without ID', function () {
    return assert.throws(() => {
      new Card();
    }, Error );
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
});

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
};
