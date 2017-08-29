"use strict";
const CARD_PADDING = 35;
const CARD_WIDTH = 250;
const TOTAL_SIZE = CARD_WIDTH + CARD_PADDING;
const OFFSET_LEFT = 35;
const OFFSET_TOP = 15;
const uuidv4 = require('uuid/v4');
// const Card = require('../app/Card.js');

module.exports = class Stack {
  // constructor uses ECMA-262 rest parameters and spread syntax
  constructor(card1, card2) {
    this.cards = [];
    this.id = 3;
    this.uuid = uuidv4();
    this.state = 'collapsed';

    this.stack = document.createElement('div');
    $(this.stack).attr('class', 'stack')
      .css({
        top: $(card1).css('top'),
        left: $(card1).css('left')
      });

    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'stackClose');
    $(closeButton).click(() => console.log('close button clicked'));

    this.annotation = document.createElement('textarea');
    $(this.annotation).attr({
        class: 'annotation',
        placeholder: "Write note..."
      });

    const expandButton = document.createElement('button');
    $(expandButton).attr('class', 'stackExpandButton');
    $(expandButton).click(() => console.log('expand button clicked'))

    this.stack.appendChild(closeButton);
    this.stack.appendChild(this.annotation);
    this.stack.appendChild(expandButton);
    var canvas = document.querySelector('.canvas');
    $(canvas).append(this.stack);

    this.addCard($(card1));
    this.addCard($(card2));
    this.toggleDraggable();
    this.toggleDroppable();
    this.cascadeCards();
  }

  // add individual card to the top of the stack
  addCard(currCard) {
    this.cards.push(currCard);
    $(this.stack).append(currCard[0]);
  }

  // remove individual card from the stack
  removeCard(currCard) {
    var canvas = document.querySelector('.canvas');
    $(canvas).append(currCard[0]);
      this.cards.pop();
  }

  //stack is removed if the stack contains no cards
  destructor() {
       $(this.stack).remove();
}

  // position all stacked cards according to their index within the stack
  cascadeCards() {
    for(var i = 0; i < this.cards.length; i++){
      $(this.cards[i]).css({
        top: $(this.stack).offset().top + ((i + 1) * 25) + 'px',
        left: $(this.stack).offset().left + ((i + 1) * 25) + 'px',
        'z-index': (i + 1),
      });
    }
  }

  //enables a stack to be dragged
  toggleDraggable() {
    if($(this.stack).data('draggable')) {
      $(this.stack).draggable('disable');
    }
    else {
      $(this.stack).draggable({
        containment: 'window',
        stack: '.stack, .card',
        drag: (event, ui) => this.cascadeCards(),
      });
    }
  }

  //enables cards to be added to a stack
    toggleDroppable() {
      $(this.stack).droppable({
        accept: '.card, .stack',
        classes: {
          'ui-droppable-hover': 'highlight',
        },
        drop: (event, ui) => {
          // handle card-to-stack drop event
          if ($(ui.draggable).hasClass('card')) {
            $(ui.draggable).droppable('disable');
            this.addCard($(ui.draggable));
            this.cascadeCards();
          }
        },
        out: (event, ui) => {
          $(ui.draggable).droppable('enable');
          this.removeCard($(ui.draggable));
          if (this.cards.length == 0) {
            this.destructor();
            return;
          }
          this.cascadeCards();
          this.resizeStack();
        },
      });
    }

}
