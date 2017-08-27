"use strict";
const CARD_PADDING = 35;
const CARD_WIDTH = 250;
const TOTAL_SIZE = CARD_WIDTH + CARD_PADDING;
const OFFSET_LEFT = 35;
const OFFSET_TOP = 15;
const uuidv4 = require('uuid/v4');
const Card = require('../app/Card.js');
const winston = require("winston");
const logging = require("./../lib/logger");


module.exports = class Stack {
  // constructor uses ECMA-262 rest parameters and spread syntax
  constructor(cards, cardObjects) {
    console.log("weee")
    this.cards = [];
    this.cardObjects = cardObjects;
    this.id = 3;
    this.uuid = uuidv4();
    this.state = 'collapsed';
    this.loggers = new logging(winston);
    this.stack = document.createElement('div');
    $(this.stack).attr('class', 'stack')
    // .css({
    //   top: $(cards[0]).offset().top - 25,
    //   left: $(cards[0]).offset().left - 25,
    // });
    this.closeButton = document.createElement('button');
    $(this.closeButton).attr('class', 'stackClose');
    $(this.closeButton).click(() => console.log('close button clicked'))


    this.annotation = document.createElement('textarea');
    $(this.annotation).attr({
      class: 'annotation',
      placeholder: "Write note..."
    });

    this.expandButton = document.createElement('button');
    $(this.expandButton).attr('class', 'stackExpandButton');
    $(this.expandButton).click(() => console.log('expand button clicked'))

    this.stack.appendChild(this.closeButton);
    this.stack.appendChild(this.annotation);
    this.stack.appendChild(this.expandButton);
    document.body.appendChild(this.stack);

    for (var i = 0; i < cards.length; i++) {
      this.addCard(cards[i]);
    }
    this.toggleDraggable();
    this.cascadeCards();
    this.initStackCreationLog();
  }

  initStackCreationLog() {
    let initString = '{\"Stack\": \"' + this.uuid + '\" ,';
    initString += '\"Bottom Card\": \"' + this.cardObjects[0].uuid + '\", ';
    initString += '\"Top Card\": \"' + this.cardObjects[1].uuid + '\"}'
    this.loggers.stackCreations.info(initString)
  }

  // add individual card to the top of the stack
  addCard(currCard) {
    this.cards.push(currCard);
    let body = document.querySelector('.card');
    this.stack.appendChild(body);
    // currCard.droppable('disable');
    console.log('card added');
  }

  // remove individual card from the stack
  removeCard() {
    this.cards.pop();
  }

  // position all stacked cards according to their index within the stack
  cascadeCards() {
    for (var i = 0; i < this.cards.length; i++) {
      $(this.cards[i]).css({
        top: $(this.stack).offset().top + ((i + 1) * 25) + 'px',
        left: $(this.stack).offset().left + ((i + 1) * 25) + 'px',
        'z-index': (i + 1),
      });
    }
  }

  //enables a stack to be dragged
  toggleDraggable() {
    if ($(this.stack).data('draggable')) {
      $(this.stack).draggable('disable');
    } else {
      $(this.stack).draggable({
        containment: 'window',
        stack: '.stack, .card',
        drag: (event, ui) => this.cascadeCards(),
      });
    }
  }
}