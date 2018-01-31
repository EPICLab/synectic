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
  private gap: number = 25;

  constructor(first: Card, ...other: Card[]) {
    super(first.parent);
    this.element.setAttribute('class', 'stack');
    $(this.element).css({
      height: first.element.offsetHeight + this.gap + 28,
      width: first.element.offsetWidth + this.gap,
      top: first.element.offsetTop - 10,
      left: first.element.offsetLeft - 10
    });

    [first, ...other].map(c => this.add(c));

    // HTMLElement must be appended to DOM before enabling Draggable/Droppable
    this.parent.add(this);
    this.setDraggable(true);
    this.setDroppable(true);

    document.addEventListener('destruct', (e) => {
      const uuid: string = (e as CustomEvent).detail;
      const found: Card | undefined = this.search(uuid).pop();
      if (found) {
        this.remove(found);
      }
    }, false);
  }

  public destructor(): void {
    const event = new CustomEvent('destruct', { detail: this.uuid });
    document.dispatchEvent(event);
    this.children.map(c => this.remove(c));
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }

  public closest<T extends Base>(selector: T): T | null {
    return super.closest(selector);
  }

  public add<T extends Base & Draggable & Droppable>(card: T): boolean {
    if (super._add(card)) {
      card.setDroppable(false);
      this.element.appendChild(card.element);
      const styleWidth: string | null = this.element.style.width;
      const styleHeight: string | null = this.element.style.height;
      const width: number = (styleWidth ? parseInt(styleWidth, 10) : 0);
      const height: number = (styleHeight ? parseInt(styleHeight, 10) : 0);
      $(this.element).css({
        width: (width + this.gap).toString() + 'px',
        height: (height + this.gap).toString() + 'px'
      });
      $(card.element).css({
        top: (this.children.length * this.gap).toString() + 'px',
        left: (this.children.length * this.gap).toString() + 'px'
      });
      return true;
    }
    return false;
  }

  public remove(card: Card): boolean {
    if (super._remove(card) && this.parent) {
      this.parent.add(card);
      card.setDroppable(true);
      $(this.element).css({
        width: this.element.offsetWidth - this.gap,
        height: this.element.offsetHeight - this.gap
      });
      return true;
    }
    return false;
  }

  public search(uuid: string): Card[] {
    return super._search(uuid).map(c => c as Card);
  }

  public setDraggable(opt: boolean): void {
    if (!this.element.classList.contains('ui-draggable')) {
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
    if (!this.element.classList.contains('ui-droppable')) {
      $(this.element).droppable({
        accept: '.card, .stack',
        drop: (_, ui) => {
          const bottom = $(ui.draggable);
          const bottomUuid: string = bottom.attr('id') as string;
          const canvas: Canvas = this.closest(Canvas.prototype) as Canvas;

          if (bottom.hasClass('stack')) {
            const bottomStack: Stack = canvas.search(bottomUuid).pop() as Stack;
            this.children.map(c => {
              this.remove(c);
              bottomStack.add(c);
            });
            this.destructor();
          } else {
            const bottomCard: Card = canvas.search(bottomUuid).pop() as Card;
            this.add(bottomCard);
          }
        },
        out: (_, ui) => {
          const depart = $(ui.draggable);
          const departUuid: string = depart.attr('id') as string;
          const departCard: Card = this.search(departUuid).pop() as Card;
          this.remove(departCard);
        }
      });
    }

    if (opt) {
      $(this.element).droppable('enable');
    } else {
      $(this.element).droppable('disable');
    }
  }

}
