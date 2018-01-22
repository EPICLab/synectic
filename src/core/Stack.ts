import { Base } from './Base';
// import { Canvas } from './Canvas';
import { Card } from './Card';
import 'jquery';

export class Stack extends Base {

  public children: Array<Card> = new Array();

  constructor(first: Card, ...other: Array<Card>) {
    super(first.parent as Base);

    [first, ...other].map(c => this.add(c));

    $(this.element).attr('class', 'stack');
    (this.parent as Base).element.appendChild(this.element);

    $(this.element).css({
      top: parseInt($(this.children[0].element).css('top'), 10) - 10,
      left: parseInt($(this.children[0].element).css('left'), 10) - 10
    });
  }

  add(card: Card): void {
    this.children.push(card);
    $(this.element).append(card.element);
    card.setDroppable(false);
  }

  remove(card: Card): boolean {
    if (this.children.some(c => c === card)) {
      this.children = this.children.filter(c => c !== card);
      if (this.parent) {
        this.parent.element.appendChild(card.element);
        card.setDroppable(true);
      }
      return true;
    }
    return false;
  }

  find(uuid: string): Array<Card> {
    return this.children.filter(c => c.uuid === uuid);
  }

}
