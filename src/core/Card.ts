import { Base } from './base';
import { Canvas } from './Canvas';
import { Stack } from './Stack';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { Draggable, Droppable, OptionState, Selectable } from './interactions';
import { hasClass, addClass, removeClass } from './helper';
import { Menu, remote } from 'electron';

/**
 * Template definition of a card; can be extended to support specific content.
 */
export class Card implements Base<(Canvas | Stack), null>,
  Draggable, Droppable, Selectable {

  uuid: string = v4();
  created: DateTime = DateTime.local();
  modified: DateTime = DateTime.local();
  filetypes: string[];
  parent: Canvas | Stack;
  children: null[] = [];
  element: HTMLDivElement = document.createElement('div');
  header: HTMLDivElement = document.createElement('div');
  title: HTMLSpanElement = document.createElement('span');
  closeButton: HTMLButtonElement = document.createElement('button');

  /**
   * Default constructor for creating a blank card with standard interaction controls.
   * @param parent A canvas or stack instance that will contain the new card.
   * @param filetypes An array of filetype extensions supported by a particular card type (i.e. ['js', 'jsx']).
   */
  constructor(parent: Canvas | Stack, filetypes: string[]) {
    this.parent = parent;
    this.filetypes = filetypes;
    this.element.setAttribute('class', 'card');
    this.element.setAttribute('id', this.uuid);
    this.header.setAttribute('class', 'card-header');
    this.title.innerHTML = 'My Card';
    this.closeButton.setAttribute('class', 'close');
    // $(this.closeButton).click(() => this.destructor());

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

  /**
   * Default destructor for detaching from parent and dispatching a 'destruct' event; does not destroy instance.
  */
  destructor(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    const event = new CustomEvent('destruct', { detail: this.uuid });
    document.dispatchEvent(event);
  }

  /**
   * Configuration for enabling/disabling draggable from JQuery-UI library.
   * @param opt A OptionState to enable or disable draggable interactions for this card.
   */
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

  /**
   * Configuration for enabling/disabling droppable from JQuery-UI library.
   * @param opt A OptionState to enable or disable droppable interactions for this card.
   */
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

  /**
   * Configuration for enabling/disabling selectable from JQuery-UI library.
   * @param opt A OptionState to enable or disable selectable interactions for this card.
   */
  selectable(opt: OptionState): void {
    const canvas: Canvas = this.parent instanceof Canvas ? this.parent
      : this.parent.parent;
    $(canvas.element).selectable({
      filter: '.card',
      cancel: 'input, textarea, button, select, option',
      selected: (_, ui) => {
        if (!(ui.selected)) throw new Error('Selected returns undefined');
        const uuid: string = ui.selected.id;
        const found: Stack | Card | undefined = canvas.search(uuid).pop();
        if (!(found instanceof Card)) throw new Error('Selected not a Card');
        addClass(found.element, 'highlight');
        found.element.addEventListener('contextmenu', this.contextMenu);
      },
      unselected: (_, ui) => {
        const uuid: string = ui.unselected.id;
        const found: Stack | Card | undefined = canvas.search(uuid).pop();
        if (!(found instanceof Card)) throw new Error('Unselected not a Card');
        removeClass(found.element, 'highlight');
        found.element.removeEventListener('contextmenu', this.contextMenu);
      }
    });
    $(canvas.element).selectable(opt);
  }

  /**
   * Handler to build context menu for selectable cards; includes event handlers for each MenuItem.
   */
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
    aContextMenu.popup({});
  }

}
