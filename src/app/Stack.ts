import { Base } from './Base';
import { Canvas } from './Canvas';
import { Card } from './Card';
import 'jquery';

export class Stack extends Base {

  public cards: Card[];

  constructor(parent: Canvas, first: Card, ...other: Card[]) {
    super(parent);
    this.cards = [first, ...other];

    $(this.element).attr('class', 'stack');
    $(this.element).css({
      top: $(first.element).css('top'),
      left: $(first.element).css('left')
    });

    this.cards.map(c => this.add(c));
    this.parent.element.appendChild(this.element);
  }

  add(card: Card) {
    this.cards.push(card);
    $(this.element).append(card.element);
  }

  remove(card: Card) {
    if (this.cards.some(c => c === card)) {
      this.cards = this.cards.filter(c => c !== card);
      if (this.parent) {
        this.parent.element.appendChild(card.element);
      }
    }
  }
}
