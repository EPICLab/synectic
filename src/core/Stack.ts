import { Base } from './Base';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';
import { Canvas } from './Canvas';
import { Card } from './Card';
import 'jquery-ui';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';

export class Stack extends Base implements Draggable, Droppable {

  public parent: Canvas;
  public children: Card[] = new Array();
  private cardOffset: number = 25;

  constructor(first: Card, ...other: Card[]) {
    super(first.parent);
    this.element.setAttribute('class', 'stack');
    $(this.element).css({
      width: ((2 + other.length) * this.cardOffset) + first.element.offsetWidth + 'px',
      top: parseInt($(first.element).css('top'), 10) - 10,
      left: parseInt($(first.element).css('left'), 10) - 10
    });

    [first, ...other].map(c => this.add(c));

    // HTMLElement must be appended to DOM before enabling Draggable/Droppable
    this.parent.add(this);
    this.setDraggable(true);
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

  public add<T extends Base & Droppable & Draggable>(card: T): boolean {
    const added: boolean = super._add(card);
    card.setDroppable(false);
    card.setDraggable(false);

    $(card.element).css({
      top: (this.children.length * this.cardOffset).toString() + 'px',
      left: (this.children.length * this.cardOffset).toString() + 'px'
    });
    return added;
  }

  public remove(card: Card): boolean {
    if (super._remove(card) && this.parent) {
      this.parent.add(card);
      card.setDroppable(true);
      card.setDraggable(true);
      return true;
    }
    return false;
  }

  public search(uuid: string): Card[] {
    return super._search(uuid).map(c => c as Card);
  }

  public setDraggable(opt: boolean): void {
    if (!this.element.classList.contains('draggable')) {
      $(this.element).draggable({
        containment: 'window',
        stack: '.stack',
        start: function() {
          $(this).css({
            transform: 'none'
          });
        }
      });
    }

    if (opt) {
      $(this.element).draggable('enable');
    } else {
      $(this.element).draggable('disable');
    }
  }

  public setDroppable(opt: boolean): void {
    throw new Error('Method not implemented.' + opt);
  }

}
