"use strict";

module.exports = class Card {
  constructor(id = throwIfMissing('id')) {
    this.id = id;
    this.createdBy = require('username').sync();
    this.createdTimestamp = new Date();
    this.lastInteraction = new Date();
  }

  updateMetadata() {
    this.lastInteraction = new Date();
  }

  toggleDraggable() {

  }

  toggleDroppable() {

  }
}

function throwIfMissing(param) {
  throw new Error('Missing parameter \'' + param + '\'');
}
