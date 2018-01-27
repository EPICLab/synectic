import { Base } from './Base';
import { Droppable } from './Droppable';
import { Canvas } from './Canvas';
import { Card } from './Card';
import 'jquery';

export class Stack extends Base {

  public parent: Canvas;
  public children: Card[] = new Array();

  constructor(first: Card, ...other: Card[]) {
    super(first.parent);
    this.element.setAttribute('class', 'stack');
    [first, ...other].map(c => this.add(c));

    $(this.element).css({
      top: parseInt($(this.children[0].element).css('top'), 10) - 10,
      left: parseInt($(this.children[0].element).css('left'), 10) - 10
    });
  }

  public destructor(): void {
    const event = new CustomEvent('remove', { detail: this.uuid });
    document.dispatchEvent(event);
    this.children.map(c => this.parent.add(c));
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }

  public closest<T extends Base>(selector: T): T | null {
    return super.closest(selector);
  }

  public add<T extends Base & Droppable>(card: T): boolean {
    card.setDroppable(false);
    return super._add(card);
  }

  public remove(card: Card): boolean {
    if (super._remove(card) && this.parent) {
      this.parent.add(card);
      card.setDroppable(true);
      return true;
    }
    return false;
  }

  public search(uuid: string): Card[] {
    return super._search(uuid).map(c => c as Card);
  }

}
