"use strict";
const CARD_PADDING = 35;
const CARD_WIDTH = 250;
const TOTAL_SIZE = CARD_WIDTH + CARD_PADDING;
const OFFSET_LEFT = 35;
const OFFSET_TOP = 15;
const Card = require('../app/Card.js');
const Canvas = require('../app/Canvas.js');

module.exports = class Stack {
  // constructor uses ECMA-262 rest parameters and spread syntax
  constructor() {
    this.cards = [];
    this.state = 'collapsed';

    this.stack = document.createElement('div');
    $(this.stack).attr('class', 'stack');

    this.closeButton = document.createElement('button');
    $(this.closeButton).attr('class', 'stackClose');

    this.annotation = document.createElement('textarea');
    $(this.annotation).attr({
        class: 'annotation',
        placeholder: "Write note..."
      });

    this.expandButton = document.createElement('button');
    $(this.expandButton).attr('class', 'stackExpandButton');

    this.stack.appendChild(this.closeButton);
    this.stack.appendChild(this.annotation);
    this.stack.appendChild(this.expandButton);
    document.body.appendChild(this.stack);
  }

  // add individual card to the top of the stack
  addCard(card) {
    this.cards.push(card);
  }

  // remove individual card from the stack
  removeCard() {
    this.cards.pop();
  }

  // position all stacked cards according to their index within the stack
  cascadeCards() {
    this.cards.forEach((cards, index) => {
      $(cards.card).css({
        top: $(this.stack).offset().top + ((index + 1) * 25) + 'px',
        left: $(this.stack).offset().left + ((index + 1) * 25) + 'px',
        'z-index': (index + 1),
      });
    });
  }
}
