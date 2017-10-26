"use strict";
const Error = require('../lib/error.js');
const uuidv4 = require('uuid/v4');
const Dialog = require('../app/Dialog.js');
const Card = require('../app/Card.js');

module.exports = class Canvas {
  constructor({
    id = Error.throwIfMissing('id')
  }) {
    this.id = id;
    this.uuid = uuidv4();
    this.cards = [];

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

    this.toggleSelectable();
  }

  addCard(cardType = 'text', modality = true) {
    let card = new Card({
      id: this.nextCardId(),
      type: cardType,
      context: this.canvas,
      modal: modality
    });
    this.cards.push(card);
    return card;
  }

  removeCard({id, uuid} = {}) {
    if (uuid !== undefined) {
      let found = this.cards.find(card => card.uuid === uuid);
      let index = this.cards.indexOf(found);
      found.destructor();
      this.cards.splice(index, 1);
    } else if (id !== undefined) {
      let found = this.cards.find(card => card.id === id);
      let index = this.cards.indexOf(found);
      found.destructor();
      this.cards.splice(index, 1);
    } else {
      Error.throwIfMissingMinimum(1, 'id', 'uuid');
    }
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
    let dialog = Dialog.dialog({context: this.canvas});

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
    let dialog = Dialog.notice({height: '300px', width: '400px', context: this.canvas});
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

  handleContexMenu() {
    const ContextMenu = require('../app/ContextMenu.js');
    const { Menu, MenuItem } = require('electron').remote;
    let contextMenu = Menu.buildFromTemplate(ContextMenu.selectionTemplate);
    contextMenu.popup();
  }

  toggleSelectable() {
    $(this.canvas).selectable({
      filter: 'div.card',
      cancel: 'input,textarea,button,select,option',
      selecting: (event, ui) => {
        if ($('.ui-selecting').length > 1) {
          $('.ui-selecting').map((i, selecting) => {
            $(selecting).addClass('highlight');
          });
        }
      },
      selected: (event, ui) => {
        if ($('.ui-selected').length > 1) {
          $('.ui-selected').map((i, selected) => {
            $(selected).addClass('highlight');
            selected.addEventListener('contextmenu', this.handleContexMenu);
          });
        }
      },
      unselecting: (event, ui) => {
        $(ui.unselecting).removeClass('highlight');
      },
      unselected: (event, ui) => {
        $(ui.unselected).removeClass('highlight');
        ui.unselected.removeEventListener('contextmenu', this.handleContexMenu);
      }
    });

    //allow the usage of the Meta-key (Ctrl/Cmd) to select/deselect cards
    $('.selector').bind('mousedown', function (e) {
      e.metaKey = true;
    }).selectable();
  }

};
