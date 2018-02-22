import { Base } from './base';
import { Canvas } from './Canvas';
import { Stack } from './Stack';
import { v4 } from 'uuid';
import { Draggable, Droppable, OptionState, Selectable } from './interactions';
import { hasClass, addClass, removeClass } from './helper';
import { Menu, remote } from 'electron';

export class Card implements Base<(Canvas | Stack), null>,
  Draggable, Droppable, Selectable {

  uuid: string = v4();
  created: number = Date.now();
  modified: number = Date.now();
  parent: Canvas | Stack;
  children: null[] = [];
  element: HTMLDivElement = document.createElement('div');
  header: HTMLDivElement = document.createElement('div');
  title: HTMLSpanElement = document.createElement('span');
  closeButton: HTMLButtonElement = document.createElement('button');

  constructor(parent: Canvas | Stack) {
    console.log('Card constructor...');
    this.parent = parent;
    this.element.setAttribute('class', 'card');
    this.element.setAttribute('id', this.uuid);
    this.header.setAttribute('class', 'card-header');
    this.title.innerHTML = 'My Card';
    this.closeButton.setAttribute('class', 'close');
    $(this.closeButton).click(() => this.destructor());

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeButton);
    this.element.appendChild(this.header);

    if (this.parent instanceof Canvas) this.parent.add(this);
    if (this.parent instanceof Stack) this.parent.add(this);
    $(this.element).css({
      transform: 'none',
      top: this.element.offsetTop - (this.element.offsetHeight / 2),
      left: this.element.offsetLeft - (this.element.offsetWidth / 2)
    });
    this.draggable(OptionState.enable);
    this.droppable(OptionState.enable);
    this.selectable(OptionState.enable);
  }

  destructor(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    const event = new CustomEvent('destruct', { detail: this.uuid });
    document.dispatchEvent(event);
  }

  draggable(opt: OptionState): void {
    if (!hasClass(this.element, 'ui-draggable')) {
      $(this.element).draggable({
        handle: '.card-header',
        containment: 'parent',
        stack: '.card, .stack',
        start: function() {
          $(this).css({ transform: 'none' });
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
          const canvas: Canvas = this.parent instanceof Canvas ? this.parent
            : this.parent.parent;
          if (bottom.hasClass('card')) {
            const bottomCard: Card = canvas.search(uuid).pop() as Card;
            new Stack(canvas, [this, bottomCard]);
          }
          if (bottom.hasClass('stack')) {
            const bottomStack: Stack = canvas.search(uuid).pop() as Stack;
            bottomStack.add(this);
          }
        }
      });
    }
    $(this.element).droppable(opt);
  }

  selectable(opt: OptionState): void {
    const canvas: Canvas = this.parent instanceof Canvas ? this.parent
      : this.parent.parent;
    $(canvas.element).selectable({
      filter: '.card',
      cancel: 'input, textarea, button, select, option',
      selected: (_, ui) => {
        const selected: JQuery<HTMLElement> = $(ui.selected);
        const uuid: string = selected.attr('id') as string;
        const found: Stack | Card | undefined = canvas.search(uuid).pop();
        if (!(found instanceof Card)) throw new Error('Selected not a Card');
        addClass(found.element, 'highlight');
        found.element.addEventListener('contextmenu', this.contextMenu);
      },
      unselected: (_, ui) => {
        const unselected: JQuery<HTMLElement> = $(ui.unselected);
        const uuid: string = unselected.attr('id') as string;
        const found: Stack | Card | undefined = canvas.search(uuid).pop();
        if (!(found instanceof Card)) throw new Error('Unselected not a Card');
        removeClass(found.element, 'highlight');
        found.element.removeEventListener('contextmenu', this.contextMenu);
      }
    });
    $(canvas.element).selectable(opt);
  }

  contextMenu(): void {
    const menuOptions = [
      {
        label: 'New Stack',
        click: () => {
          const canvas: Canvas = global.Synectic.current;
          let uuids: string[] = [];
          $('.ui-selected').map((_, s) => uuids.push($(s).attr('id') as string));
          let cards = uuids.map((uuid) => canvas.search(uuid).pop() as Card);
          if (cards.length >= 1) {
            cards.map((card) => {
              removeClass(card.element, 'highlight');
              removeClass(card.element, 'ui-selected');
              removeClass(card.element, 'ui-selectee');
            });
            new Stack(canvas, cards);
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

    let aContextMenu: Menu = remote.Menu.buildFromTemplate(menuOptions);
    aContextMenu.popup();
  }

}
