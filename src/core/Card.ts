import { Base } from './Base';
import { Draggable, Droppable, State } from './Interactions';
import { Menu, remote } from 'electron';
import { Canvas } from './Canvas';
import { Stack } from './Stack';

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
    // this.setDraggable(true);
    this.draggable(State.enable);
    this.droppable(State.enable);
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

  public draggable(opt: State): void {
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

          if (bottom.hasClass('card')) { // This Card dropped onto Card
            const bottomCard: Card = canvas.search(bottomUuid)[0] as Card;
            new Stack([this, bottomCard]);
          } else { // This Card dropped onto Stack
            const bottomStack: Stack = canvas.search(bottomUuid)[0] as Stack;
            bottomStack.add(this);
          }
        }
      });
    }

    $(this.element).droppable(opt);
  }

  public setSelectable(opt: boolean): void {
    const canvas: Canvas = global.SynecticManager.current;
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
          let cards = uuids.map((uuid) => canvas.search(uuid).pop() as Card);
          if (cards.length >= 1) {
            cards.map((card) => {
              card.removeClass('highlight');
              card.removeClass('ui-selected');
              card.removeClass('ui-selectee');
            });
            let c: Card = cards.pop() as Card;
            let x = new Stack([c]);
            cards.map(c => x.add(c));
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
