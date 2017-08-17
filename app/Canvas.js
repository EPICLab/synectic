"use strict";
const Dialog = require('../app/Dialog.js');
const Card = require('../app/Card.js');

module.exports = class Canvas {
  constructor() {
    this.cards = [];
    this.canvasLoggerInit();

    this.canvas = document.createElement('div');
    $(this.canvas).attr('class', 'canvas');

    const versionDialogButton = document.createElement('button');
    $(versionDialogButton).click(() => { this.displayVersion(); });
    $(versionDialogButton).html('Version');

    const modalDialogButton = document.createElement('button');
    $(modalDialogButton).click(() => { this.addObj(); });
    $(modalDialogButton).html('Modal Dialog');

    const addCardButton = document.createElement('button');
    $(addCardButton).click(() => { this.addCard('text'); });
    $(addCardButton).html('Add Card');

    const printCardsButton = document.createElement('button');
    $(printCardsButton).click(() => { this.printCards(); });
    $(printCardsButton).html("Print Card(s)");

    this.canvas.appendChild(versionDialogButton);
    this.canvas.appendChild(modalDialogButton);
    this.canvas.appendChild(document.createElement('br'));
    this.canvas.appendChild(addCardButton);
    this.canvas.appendChild(printCardsButton);
    document.body.appendChild(this.canvas);
  }

  canvasLoggerInit(){
    console.log("weeee")
    let initString = "Canvas Created, ";
    initString += "Canvas Height: " + window.innerHeight + "px, ";
    initString += "Canvas Width: " + window.innerWidth + "px."
    console.log(logs.log)
    logs.log("canvasCreation",initString);
  }

  addCard(cardType = 'text', modality = true) {
    let card = new Card({
      id: this.nextCardId(),
      type: cardType,
      context: this.canvas,
      modal: modality
    });
    this.cards.push(card);
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
    console.log('CARDS (' + this.cards.length + ')');
    for (var card of this.cards) {
      card.printMetadata();
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
