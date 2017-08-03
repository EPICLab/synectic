"use strict";

module.exports = class Card {
  constructor(id = throwIfMissing('id')) {
    this.id = id;
  }

}

function throwIfMissing(param) {
  throw new Error('Missing parameter \'' + param + '\'');
}
