"use strict";
const CARD_PADDING = 35;
const CARD_WIDTH = 250;
const TOTAL_SIZE = CARD_WIDTH + CARD_PADDING;
const OFFSET_LEFT = 35;
const OFFSET_TOP = 15;
const uuidv4 = require('uuid/v4');
const Card = require('../app/Card.js');
const Canvas = require('../app/Canvas.js')

module.exports = class Stack {
  // constructor uses ECMA-262 rest parameters and spread syntax
  constructor(...cards) {
    this.cards = [];
    this.id = 3;
    this.uuid = uuidv4();
    this.state = 'collapsed';

    this.stack = document.createElement('div');
    $(this.stack).attr('class', 'stack')
    //cards[0][0] is being read as undefined
      // .css({
      //   top: $(cards[0][0]).offset().top,
      //   left: $(cards[0][0]).offset().left
      // });
      // console.log(cards[0][0].constructor.name);
      // console.log($(cards[0][0]).offset().top);
      // console.log($(cards[0][0]).offset().left);
      // console.log(this.stack.style.top);
      // console.log(this.stack.style.left);

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

    for(var i = 0; i < cards.length; i++){
      this.addCard(cards[i]);
      $(cards[i]).droppable('disable');
    }
    this.toggleDraggable();
    this.toggleDroppable();
    this.cascadeCards(cards[i]);
  }

  // add individual card to the top of the stack
  addCard(currCard) {
    this.cards.push(currCard);
    let body = document.querySelector('.card');
    this.stack.appendChild(body);
  }

  // remove individual card from the stack
  removeCard(currCard) {
    // $(currCard).droppable('enable'); //error: cannot call methods on droppable prior to
                                        //initialization; attempted to call method 'enable
    let card = document.querySelector('.card');
    document.body.appendChild(card);
    this.cards.pop();
  }

  //stack is removed if the stack contains less than two cards
  destructor() {
    for(var i = 0; i < this.cards.length; i++){
      this.removeCard($(this.cards)[i]);
    }
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
          this.addCard($(ui.draggable));
          this.cascadeCards();
        }
      },
      out: (event, ui) => {
        this.removeCard($(ui.draggable));
        if (this.cards.length < 2) {
          this.destructor();
          return;
        };
        this.cascadeCards();
      },
    });
  }

}
