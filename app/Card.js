"use strict";
const Error = require('../app/Error.js');

module.exports = class Card {

  constructor({
      id = Error.throwIfMissing('id'),
      context = Error.throwIfMissing('context'),
      modal = true
    }) {
    this.id = id;
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


    //for metadata
    this.createdTimestamp = new Date().toString();
    this.lastInteraction = new Date();
    // npm module: username, url: https://www.npmjs.com/package/username
    this.createdBy = require('username').sync();

    this.cardBuilder(type);
    this.updateMetadata();
  }

  cardBuilder(type) {
    var card = document.createElement('div');
    $(card).attr({
      id: 'card_' + this.id,
      type: type,
      class: 'card',
    });
    this.card = card;

    var header = document.createElement('div');
    $(header).attr({
      id: 'header_' + this.id,
      class: 'card-header',
    });

    let nameBox = document.createElement("span");
    $(nameBox).addClass("nameBox");
    $(nameBox).html("Card: " + this.id);
    this.name = "Card: " + this.id;

    $(header).append(nameBox);

    var closeButton = document.createElement('button');
    $(closeButton).attr({
      id: 'close_button_' + this.id,
      class: 'close',
    });
    $(closeButton).click(function() {
      let card = this.closest('.card');
      let id = (card.id).split('_');
      let cleanID = parseInt(id[id.length - 1]);
      delete canvas.cards[cleanID];
      card.remove();
      console.log("in close button");
    });

    var saveButton = document.createElement('button');
    $(saveButton).attr({
      id: 'save_button' + this.id,
      class: 'save',
    });

    var fullscreenButton = document.createElement('button');
    $(fullscreenButton).attr({
      id: 'fullscreen_button_' + this.id,
      class: 'expand',
    });

    header.appendChild(closeButton);
    header.appendChild(saveButton);
    header.appendChild(fullscreenButton);
    card.appendChild(header);
    document.body.appendChild(card);
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
