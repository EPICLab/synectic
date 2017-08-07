"use strict";
const Dialog = require('../app/Dialog.js');
const Card = require('../app/Card.js');

module.exports = class Canvas {
  constructor() {
    this.cards = [];
  }

  addCard(cardType = 'text') {
    let card = new Card(this.nextCardId());
    this.cards.push(card);
  }

  removeCard() {
    this.cards.pop();
  }

  nextCardId() {
    let ids = this.cards.map((card) => {
      return card.id;
    });
    if (ids.length < 1) return 1; // no cards on canvas yet

    let next = 1;
    while (ids.indexOf(next += 1) > -1);
    return next;
  }

  printCards() {
    console.log('CARDS: (' + this.cards.length + ')');
    for (var card of this.cards) {
      console.log('card: ' + card.id);
    }
  }

  addObj() {
    let dialog = Dialog.dialog();

    const ackButton = document.createElement('button');
    $(ackButton).attr('class', 'acknowledge');
    $(ackButton).html('OK');
    $(ackButton).click(function() { this.closest('.dialog').remove(); });
    dialog.appendChild(ackButton);

    let myNotification = new Notification('Title', {
      body: 'username: ' + require('username').sync()
    });

    myNotification.onclick = () => {
      console.log('Notification clicked')
    };
  };

  displayVersion() {
    let dialog = Dialog.notice({height: '300px', width: '400px'});
    let remoteApp = require('electron').remote.app;

    const logo = document.createElement('img');
    const versionText = document.createElement('div');

    $(logo).attr('id', 'version_logo');
    $(versionText).attr('id', 'version_text');
    $(versionText).html(
      remoteApp.getName() + ' ' + remoteApp.getVersion() + '<br/>' +
      '<span id=\'frameworks\'>' +
      'Node.js ' + process.versions.node + ', ' +
      'Chrome ' + process.versions.chrome + ', and ' +
      'Electron ' + process.versions.electron + '</span>'
    );

    dialog.appendChild(logo);
    dialog.appendChild(versionText);
  }
};
