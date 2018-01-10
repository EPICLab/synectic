import { Base } from './Base';
import { Canvas } from './Canvas';
import { Stack } from './Stack';
import 'jquery';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';

export class Card extends Base {

  public header: HTMLDivElement;
  private title: HTMLSpanElement;
  private closeButton: HTMLButtonElement;

  constructor(parent: Base | Canvas) {
    super(parent);
    $(this.element).attr('class', 'card');

    this.header = document.createElement('div');
    $(this.header).attr('class', 'card-header');

    this.title = document.createElement('span');
    $(this.title).html('My Card');

    this.closeButton = document.createElement('button');
    $(this.closeButton).attr('class', 'close');
    $(this.closeButton).click(() => {
      $(this.element).remove();
    });

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeButton);
    this.element.appendChild(this.header);
    this.parent.element.appendChild(this.element);

    this.setDraggable(true);
    this.setDroppable(true);
  }

  setDraggable(option: boolean) {
    if (option) {
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

  setDroppable(option: boolean) {
    if (option) {
      $(this.element).droppable({
        accept: '.card, .stack',
        drop: (_, ui) => {
          let bottom = $(ui.draggable);

          if (bottom.hasClass('card') && bottom.attr('id')) {
            let canvas: Canvas = this.closest<Canvas>('Canvas');
            let uuid: string = bottom.attr('id') as string;
            let bottomCard = canvas.find<Card>(uuid);
            canvas.add(new Stack(canvas, this, bottomCard));
          } else {
            console.log('it\'s Stack on Stack crime...');
          }
        }
      });
    } else {
      $(this.element).droppable('disable');
    }
  }

}
