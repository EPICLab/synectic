import { Base } from './Base';
// import { Canvas } from './Canvas';
// import { Stack } from './Stack';
import 'jquery';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';

export class Card extends Base {

  public header: HTMLDivElement;
  public title: HTMLSpanElement;
  private closeButton: HTMLButtonElement;

  constructor(parent: Base) {
    super(parent, undefined);
    this.element.setAttribute('class', 'card');

    this.header = document.createElement('div');
    this.header.setAttribute('class', 'card-header');

    this.title = document.createElement('span');
    this.title.innerHTML = 'My Card';

    this.closeButton = document.createElement('button');
    this.closeButton.setAttribute('class', 'close');
    $(this.closeButton).click(() => {
      this.destructor();
    });

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeButton);
    this.element.appendChild(this.header);

    (this.parent as Base).element.appendChild(this.element);
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
          console.log('Stack event triggered on ' + bottom.attr('class'));
          // if (bottom.hasClass('card') && bottom.attr('id')) {
          //   let canvas: Canvas = this.closest('Canvas') as Canvas;
          //   let uuid: string = bottom.attr('id') as string;
          //   let bottomCard = canvas.find(uuid)[0] as Card;
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
