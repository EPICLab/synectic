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

    // delete this.element;
  }

  public closest<T extends Base>(selector: T): T | null {
    return super.closest(selector);
  }

  public setDraggable(opt: boolean): void {
    if (opt) {
      $(this.element).draggable({
        handle: '.card-header',
        containment: 'window',
        stack: '.card, .stack',
        start: function() {
          $(this).css({
            transform: 'none'
          });
        }
      });
    } else {
      $(this.element).draggable('disable');
    }
  }

  public setDroppable(opt: boolean): void {
    if (opt) {
      $(this.element).droppable({
        accept: '.card, .stack',
        drop: (_, ui) => {
          let bottom = $(ui.draggable);
          console.log('bottom: ' + bottom.constructor.name);
          // let canvas: Canvas = this.closest(Canvas.prototype);
          // // let canvas = this.closest('Canvas') as Canvas;
          // if (bottom.hasClass('card') && bottom.attr('id')) {
          //   let uuid: string = bottom.attr('id') as string;
          //   let bottomCard = canvas.find(uuid)[0] as Card;
          //   let s: Stack = new Stack(this, bottomCard);
          //   canvas.add(new Stack(this, bottomCard));
          // } else {
          //   console.log('it\'s Stack on Stack crime...');
          // }
        }
      });
    } else {
      $(this.element).droppable('disable');
    }
  }

}
