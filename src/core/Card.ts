import { Base } from './Base';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';
import { Menu, remote } from 'electron';
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
    $(this.element).css({
      transform: 'none',
      top: this.element.offsetTop - (this.element.offsetHeight / 2),
      left: this.element.offsetLeft - (this.element.offsetWidth / 2)
    });
    this.setDraggable(true);
    this.setDroppable(true);
    this.setSelectable(true);
  }

  public destructor(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    const event = new CustomEvent('destruct', { detail: this.uuid });
    document.dispatchEvent(event);
  }

  public addClass(className: string): void {
    super.addClass(className);
  }

  public removeClass(className: string): void {
    super.removeClass(className);
  }

  public closest<T extends Base>(selector: T): T | null {
    return super.closest(selector);
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

          if (bottom.hasClass('card')) { // This Card dropped onto Card
            const bottomCard: Card = canvas.search(bottomUuid)[0] as Card;
            new Stack(this, bottomCard);
          } else { // This Card dropped onto Stack
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

  public setSelectable(opt: boolean): void {
    const canvas: Canvas = this.closest(Canvas.prototype) as Canvas;
    $(canvas.element).selectable({
      filter: '.card',
      cancel: 'input, textarea, button, select, option',
      selected: (_, ui) => {
        const selectedUuid: string = $(ui.selected).attr('id') as string;
        const card : Card = canvas.search(selectedUuid).pop() as Card;

        card.addClass('highlight');
        card.element.addEventListener('contextmenu', this.handleContextMenu);
      },
      unselected: (_, ui) => {
        console.log(ui);
        const unselectedUuid: string = $(ui.unselected).attr('id') as string;
        const card : Card = canvas.search(unselectedUuid).pop() as Card;

        card.removeClass('highlight');
        card.element.removeEventListener('contextmenu', this.handleContextMenu);
      }
    });

    if (opt) {
      $(canvas.element).selectable('enable');
    } else {
      $(canvas.element).selectable('disable');
    }
  }

  private handleContextMenu(): void {
    const menuOptions = [
      {
        label: 'New Stack',
        click: () => {
          const canvas: Canvas = global.SynecticManager.current;
          let uuids: string[] = new Array();
          $('.ui-selected').map((_, s) => uuids.push($(s).attr('id') as string));
          let cards: Card[] = uuids.map((uuid) => canvas.search(uuid).pop() as Card);
          if (cards.length >= 1) {
            cards.map((card) => {
              card.removeClass('highlight');
              card.removeClass('ui-selected');
              card.removeClass('ui-selectee');
            });
            new Stack(cards.pop() as Card, ...cards);
          }
        }
      },
      {
        label: 'New Tag',
        click: () => {
          throw new Error('Tagging has not been implemented.');
        }
      }
    ];

    let contextMenu: Menu = remote.Menu.buildFromTemplate(menuOptions);
    contextMenu.popup();
  }

}
