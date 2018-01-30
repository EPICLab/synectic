import { Base } from './Base';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';
import { Canvas } from './Canvas';
import { Stack } from './Stack';
import 'jquery-ui';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';

export class Card extends Base implements Draggable, Droppable {

  public parent: Canvas | Stack;
  public header: HTMLDivElement;
  public title: HTMLSpanElement;
  private closeButton: HTMLButtonElement;

  constructor(parent: Canvas | Stack) {
    super(parent);
    this.element.setAttribute('class', 'card');

    this.header = document.createElement('div');
    this.header.setAttribute('class', 'card-header');

    this.title = document.createElement('span');
    this.title.innerHTML = 'My Card';

    this.closeButton = document.createElement('button');
    this.closeButton.setAttribute('class', 'close');
    $(this.closeButton).click(() => this.destructor());

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeButton);
    this.element.appendChild(this.header);

    // HTMLElement must be appended to DOM before enabling Draggable/Droppable
    this.parent.add(this);
    this.setDraggable(true);
    this.setDroppable(true);
  }

  public destructor(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    const event = new CustomEvent('remove', { detail: this.uuid });
    document.dispatchEvent(event);
  }

  public closest<T extends Base>(selector: T): T | null {
    return super.closest(selector);
  }

  public getWidth(): void {
    console.log('css.width: ' + $(this.element).css('width'));
    console.log('offsetWidth: ' + this.element.offsetWidth);
    console.log('clientWidth: ' + this.element.clientWidth);
    console.log('css.attr: ' + $(this.element).attr('width'));
  }

  public setDraggable(opt: boolean): void {
    if (!this.element.classList.contains('ui-draggable')) {
      $(this.element).draggable({
        handle: '.card-header',
        containment: 'parent',
        stack: '.card, .stack',
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

          if (bottom.hasClass('card')) {
            console.log('dropped onto card');
            const bottomCard: Card = canvas.search(bottomUuid)[0] as Card;
            new Stack(this, bottomCard);
          } else {
            console.log('dropped onto stack');
            const bottomStack: Stack = canvas.search(bottomUuid)[0] as Stack;
            bottomStack.add(this);
          }
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
