import { Base } from './base';
import { Canvas } from './Canvas';
import { Card } from './Card';
import { v4 } from 'uuid';
import { OptionState, Draggable, Droppable } from './interactions';
import { hasClass, addClass, removeClass } from './helper';

export class Stack implements Base<Canvas, Card>, Draggable, Droppable {

  uuid: string = v4();
  created: number = Date.now();
  modified: number = Date.now();
  element: HTMLDivElement = document.createElement('div');
  parent: Canvas;
  children: Card[] = [];
  private gap: number = 25;

  constructor(parent: Canvas, children: Card[]) {
    this.parent = parent;
    this.element.setAttribute('class', 'stack');
    this.element.setAttribute('id', this.uuid);
    this.parent.add(this);

    const first: Card | undefined = children.pop();
    if (!first || children.length < 1) {
      throw new Error('Stack instantiation underfilled');
    }
    $(this.element).css({
      height: first.element.offsetHeight + this.gap + 28,
      width: first.element.offsetWidth + this.gap,
      top: first.element.offsetTop - 20,
      left: first.element.offsetLeft - 20
    });

    [first, ...children].map(c => this.add(c));
    this.draggable(OptionState.enable);
    this.droppable(OptionState.enable);

    document.addEventListener('destruct', (e) => {
      const uuid: string = (e as CustomEvent).detail;
      const found: Card | undefined = this.search(uuid).pop();
      if (found) {
        this.remove(found);
      }
    }, false);
    document.addEventListener('remove', () => {
      if (this.children.length <= 1) this.destructor();
    });
  }

  destructor(): void {
    this.children.map(c => this.remove(c));
    const event = new CustomEvent('destruct', { detail: this.uuid });
    document.dispatchEvent(event);
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }

  add(child: Card): boolean {
    if (this.children.some(c => c.uuid === child.uuid)) {
      return false;
    } else {
      if (child.parent instanceof Canvas) child.parent.remove(child);
      if (child.parent instanceof Stack) child.parent.remove(child);
      this.children.push(child);
      this.element.appendChild(child.element);
      child.droppable(OptionState.disable);
      this.element.appendChild(child.element);

      const sWidth: string | null = this.element.style.width;
      const sHeight: string | null = this.element.style.height;
      const width: number = (sWidth ? parseInt(sWidth, 10) : 0);
      const height: number = (sHeight ? parseInt(sHeight, 10) : 0);
      $(this.element).css({
        width: (width + this.gap),
        height: (height + this.gap)
      });
      $(child.element).css({
        top: (this.children.length * this.gap),
        left: (this.children.length * this.gap)
      });
      addClass(child.element, 'nohover');

      return true;
    }
  }

  remove(child: Card): boolean {
    if (this.children.some(c => c.uuid === child.uuid)) {
      this.children = this.children.filter(c => c !== child);
      this.parent.add(child);
      child.droppable(OptionState.enable);
      $(this.element).css({
        width: this.element.offsetWidth - this.gap,
        height: this.element.offsetHeight - this.gap
      });
      this.children.map((card, idx) => {
        $(card.element).css({
          top: ((idx + 1) * this.gap),
          left: ((idx + 1) * this.gap)
        });
      });
      $(child.element).css({
        top: this.element.offsetTop,
        left: this.element.offsetLeft
      });
      removeClass(child.element, 'nohover');
      const event = new CustomEvent('remove', { detail: child.uuid });
      document.dispatchEvent(event);
      return true;
    } else {
      return false;
    }
  }

  search(uuid: string): Card[] {
    return this.children.filter(c => c.uuid === uuid);
  }

  draggable(opt: OptionState): void {
    if (!hasClass(this.element, 'ui-draggable')) {
      $(this.element).draggable({
        containment: 'parent',
        stack: '.stack',
        start: function() {
          $(this).css({
            transform: 'none'
          });
        }
      });
    }
    $(this.element).draggable(opt);
  }

  droppable(opt: OptionState): void {
    if (!hasClass(this.element, 'ui-droppable')) {
      $(this.element).droppable({
        accept: '.card, .stack',
        drop: (_, ui) => {
          const bottom: JQuery<HTMLElement> = $(ui.draggable);
          const uuid: string = bottom.attr('id') as string;
          if (bottom.hasClass('stack')) {
            const bottomStack: Stack = this.parent.search(uuid).pop() as Stack;
            this.children.map(c => {
              this.remove(c);
              bottomStack.add(c);
            });
            this.destructor();
          } else {
            const bottomCard: Card = this.parent.search(uuid).pop() as Card;
            this.add(bottomCard);
          }
        },
        out: (_, ui) => {
          const depart: JQuery<HTMLElement> = $(ui.draggable);
          const uuid: string = depart.attr('id') as string;
          const departCard: Card = this.search(uuid).pop() as Card;
          this.remove(departCard);
        }
      });
    }
    $(this.element).droppable(opt);
  }

}
