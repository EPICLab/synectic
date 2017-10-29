"use strict";
const Error = require('../lib/error.js');
const uuidv4 = require('uuid/v4');
const Stack = require('../app/Stack.js');

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

    const saveButton = document.createElement('button');
    $(saveButton).click(() => console.log('save button clicked'))
    const fullscreenButton = document.createElement('button');
    $(fullscreenButton).click(() => console.log('fullscreen button clicked'));
    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(() => { this.destructor(); });

    this.header.appendChild(this.title);
    // this.header.appendChild(saveButton);
    // this.header.appendChild(fullscreenButton);
    this.header.appendChild(closeButton);
    this.card.appendChild(this.header);
    context.appendChild(this.card);
    if (modal) {
      this.toggleDraggable();
      this.toggleDroppable();
    }
  }

  destructor() {
    $(this.card).remove();
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
        stack: '.card, .stack',
        start: function() {
          $(this).css({
            transform: 'none',
            top: $(this).offset().top+'px',
            left: $(this).offset().left+'px'
          });
        },
        drag: (event, ui) => {
          this.updateMetadata();
        }
      });
    }
  }

  toggleDroppable() {
    if ($(this.card).data('droppable')) {
      $(this.card).droppable('disable');
    } else {
      $(this.card).droppable({
        accept: '.card, .stack',
        drop: function(event, ui) {
          //handles card-to-card drop events
          if ($(ui.draggable).hasClass('card')) {
            new Stack($(this), $(ui.draggable));
            $(this).droppable('disable');
            $(ui.draggable).droppable('disable');
          }
        },
      });
    }
  }
}
