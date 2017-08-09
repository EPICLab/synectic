"use strict";
const Error = require('../app/Error.js');

module.exports = class Card {

  constructor({
      id = Error.throwIfMissing('id'),
      context = Error.throwIfMissing('context'),
      modal = true,
    }) {
    this.id = id;
    this.name = "My Card " + this.id;
    this.inStack = false;

    //for metadata content
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
    $(this.title).attr('class', 'card-title');
    $(this.title).html(this.name);

    this.closeButton = document.createElement('button');
    $(this.closeButton).attr('class', 'close');

    this.saveButton = document.createElement('button');
    $(this.saveButton).attr('class', 'save');

    this.fullscreenButton = document.createElement('button');
    $(this.fullscreenButton).attr('class', 'expand');

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeButton);
    this.header.appendChild(this.saveButton);
    this.header.appendChild(this.fullscreenButton);
    this.card.appendChild(this.header);
    context.appendChild(this.card);
    if (modal) this.toggleDraggable();

    //for metadata contents
    this.createdTimestamp = new Date().toString();
    this.lastInteraction = new Date();
    this.createdBy = require('username').sync();
    // npm module: username, url: https://www.npmjs.com/package/username
    this.buildMetadata();
    this.updateMetadata();
  }

  buildMetadata(cardType){ //establishes metadata of card(time/date of last interaction, creator, time/date of card creation)
    let id = '#card_' + this.id + cardType + '_2';
    $(id).attr({
      class: 'card-metadata',
    });
    var metadata = 'Interaction: ' + this.lastInteraction +
      '<br/><br/>Creator: ' + this.createdBy +
      '<br/><br/>Created: ' + this.createdTimestamp;
    $(id).html(metadata);
      return metadata;
  }

  updateMetadata(cardType){ //updates metadata of card
    let id = '#card_' + this.id + cardType + '_2';
    var  updatedMetadata = 'Interaction: ' + this.lastInteraction +
    '<br/><br/>Creator: ' + this.createdBy +
    '<br/><br/>Created: ' + this.createdTimestamp;
    $(id).html(updatedMetadata);
    return updatedMetadata;
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
