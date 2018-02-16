import { Base } from './Base';
import { Draggable, Droppable, State } from './Interactions';
import { Canvas } from './Canvas';
import { Card } from './Card';

export class Stack extends Base implements Draggable, Droppable {

  public parent: Canvas;
  public children: [Card];
  private gap: number = 25;

  constructor(cards: [Card]) {
    super(cards[0].parent);
    this.element.setAttribute('class', 'stack');
    $(this.element).css({
      height: cards[0].element.offsetHeight + this.gap + 28,
      width: cards[0].element.offsetWidth + this.gap,
      top: cards[0].element.offsetTop - 10,
      left: cards[0].element.offsetLeft - 10
    });

    cards.map(card => this.add(card));

    // HTMLElement must be appended to DOM before enabling Draggable/Droppable
    this.parent.add(this);
    this.draggable(State.enable);
    this.droppable(State.enable);

    document.addEventListener('destruct', (e) => {
      const uuid: string = (e as CustomEvent).detail;
      const found: Card | undefined = this.search(uuid).pop();
      if (found) {
        this.remove(found);
      }
    }, false);
    document.addEventListener('remove', () => {
      if (this.children.length <= 1) this.destructor();
    }, false);
  }

  public destructor(): void {
    const event = new CustomEvent('destruct', { detail: this.uuid });
    document.dispatchEvent(event);
    this.children.map(c => this.remove(c));
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
  }

  public closest<T extends Base>(selector: T): T | null {
    return super.closest(selector);
  }

  public add<T extends Base & Draggable & Droppable>(card: T): boolean {
    if (super._add(card)) {
      card.droppable(State.disable);
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
      card.droppable(State.enable);
      $(this.element).css({
        width: this.element.offsetWidth - this.gap,
        height: this.element.offsetHeight - this.gap
      });
      $(card.element).css({
        top: this.element.offsetTop,
        left: this.element.offsetLeft
      });
      const event = new CustomEvent('remove', { detail: card.uuid });
      document.dispatchEvent(event);
      return true;
    }
    return false;
  }

  public search(uuid: string): Card[] {
    return super._search(uuid).map(c => c as Card);
  }

  public draggable(opt: State): void {
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

    $(this.element).draggable(opt);
  }

  public droppable(opt: State): void {
    if (!this.element.classList.contains('ui-droppable')) {
      $(this.element).droppable({
        accept: '.card, .stack',
        drop: (_, ui) => {
          const bottom = $(ui.draggable);
          const bottomUuid: string = bottom.attr('id') as string;
          const canvas: Canvas = this.closest(Canvas.prototype) as Canvas;

          if (bottom.hasClass('stack')) { // Stack dropped onto this Stack
            const bottomStack: Stack = canvas.search(bottomUuid).pop() as Stack;
            this.children.map(c => {
              this.remove(c);
              bottomStack.add(c);
            });
            this.destructor();
          } else { // Card dropped onto this Stack
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

    $(this.element).droppable(opt);
  }

}
