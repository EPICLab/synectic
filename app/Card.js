"use strict";

module.exports = class Card {
  constructor(id = throwIfMissing('id'), type, fileData) {
    this.id = id; //establishes id of each card
    this.name = ""; //updated in cardbuilder
    this.inStack = false; //false if card is not in a stack

    //for metadata
    this.creation_timestamp = new Date().toString();
    this.interaction_timestamp = this.creation_timestamp;
    // npm module: username, url: https://www.npmjs.com/package/username
    const username = require('username');
    this.creator = username.sync();

    this.cardBuilder(type);
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
    var metadata = 'Interaction: ' + this.interaction_timestamp +
      '<br/><br/>Creator: ' + this.creator +
      '<br/><br/>Created: ' + this.creation_timestamp;
    $(id).html(metadata);
      return metadata;
  }

  updateMetadata(cardType){ //updates metadata of card
    let id = '#card_' + this.id + cardType + '_2';
    var  updatedMetadata = 'Interaction: ' + new Date().toString() +
    '<br/><br/>Creator: ' + this.creator +
    '<br/><br/>Created: ' + this.creation_timestamp;
    $(id).html(updatedMetadata);
    return updatedMetadata;
  }
}

function throwIfMissing(param) {
  throw new Error('Missing parameter \'' + param + '\'');
}
