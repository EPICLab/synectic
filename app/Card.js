"use strict";
const Error = require('../lib/error.js');
const uuidv4 = require('uuid/v4');
const Stack = require('../app/Stacks.js');


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
    // this.cardLoggerInit();

    this.card = document.createElement('div');
    $(this.card).attr({
      id: this.id,
      class: 'card',
    });

    this.header = document.createElement('div');
    $(this.header).attr('class', 'card-header');

    this.title = document.createElement('span');
    $(this.title).html("My Card");

    this.closeButton = document.createElement('button');
    $(this.closeButton).click(() => console.log('close button clicked'))
    this.saveButton = document.createElement('button');
    $(this.saveButton).click(() => console.log('save button clicked'))
    this.fullscreenButton = document.createElement('button');
    $(this.fullscreenButton).click(() => console.log('fullscreen button clicked'));

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeButton);
    this.header.appendChild(this.saveButton);
    this.header.appendChild(this.fullscreenButton);
    this.card.appendChild(this.header);
    context.appendChild(this.card);
    if (modal) this.toggleDraggable();
    this.toggleDroppable();
  }

  destructor() {
    $(this.card).remove();
  }

  // cardLoggerInit(){
  //   let initString = "Card Created: " + this.createdTimestamp + ", ";
  //   initString += "Card id: " + this.uuid + ", ";
  //   initString += "Card Type: " + this.cardType +  ", ";
  //   initString += "Created By: " + this.createdBy;
  //   logger.logs("created",initString)
  // }

  updateMetadata() {
    this.lastInteraction = new Date();
  }

  printMetadata() {
    console.log('id: ' + this.id + ', uuid: ' + this.uuid);
    console.log('cardType: ' + this.cardType + ', createdBy: ' + this.createdBy);
    console.log('createdTimestamp: ' + this.createdTimestamp);
    console.log('lastInteraction: ' + this.lastInteraction);
  }

  logMovements(offset, startStop) {
    let startTop;
    let startLeft;
    if (startStop == "start") {
      startTop = offset.top + "px, "
      startLeft = offset.left + "px "
      // console.log(startTop)
    }
    if (startStop == "stop") {
      let s = "Card start left: " + startLeft + "Card start top: ";
      s += startTop


    }
  }

  toggleDraggable() {
    let self = this;
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
            top: $(this).offset().top + 'px',
            left: $(this).offset().left + 'px'
          });
          self.logMovements($(this).offset(), "start");
        },
        drag: (event, ui) => {
          this.updateMetadata();
        },
        stop: function() {
          self.logMovements($(this).offset(), "stop");
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
            // console.log(this, ui.draggable);
            // console.log($(this), $(ui.draggable));
          }
        },
      });
    }
  }
}