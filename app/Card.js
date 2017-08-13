"use strict";
const Error = require('../lib/error.js');
const uuidv4 = require('uuid/v4');

module.exports = class Card {
  constructor({
      id = Error.throwIfMissing('id'),
      type = Error.throwIfMissing('type'),
      context = Error.throwIfMissing('context'),
      modal = true
    }) {
    this.id = id;
    this.uuid = uuidv4();
    this.cardType = type;
    this.createdBy = require('username').sync();
    this.createdTimestamp = new Date();
    this.lastInteraction = new Date();

    this.card = document.createElement('div');
    $(this.card).attr({
      id: this.id,
      class: 'card',
    });

    this.header = document.createElement('div');
    $(this.header).attr('class', 'card-header');

    this.title = document.createElement('span');
    $(this.title).html("My Card");

    this.header.appendChild(this.title);
    this.card.appendChild(this.header);
    context.appendChild(this.card);
    if (modal) this.toggleDraggable();
  }

  updateMetadata() {
    this.lastInteraction = new Date();
  }

  printMetadata() {
    console.log('id: ' + this.id + ', uuid: ' + this.uuid);
    console.log('cardType: ' + this.cardType + ', createdBy: ' + this.createdBy);
    console.log('createdTimestamp: ' + this.createdTimestamp);
    console.log('lastInteraction: ' + this.lastInteraction);
  }

  toggleDraggable() {
    // warning: draggable object must be appended to DOM before being enabled
    if ($(this.card).data('draggable')) {
      $(this.card).draggable('disable');
    } else {
      $(this.card).draggable({
        handle: '.card-header',
        containment: 'window',
        start: function() {
          $(this).css({
            transform: 'none',
            top: $(this).offset().top+'px',
            left: $(this).offset().left+'px'
          });
        }
      });
    }
  }

  toggleDroppable() {
    if ($(this.card).data('droppable')) {
      $(this.card).droppable('disable');
    } else {
      $(this.card).droppable();
    }
  }
}
