import { Base } from './base';
import { Canvas } from './Canvas';
import { Stack } from './Stack';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { Draggable, Droppable, OptionState, Selectable } from './Interactions';
import { hasClass, addClass, removeClass } from './helper';
import { Menu, remote } from 'electron';
// import { Clock } from './events/Clock';

/**
 * Template definition of a card; can be extended to support specific content.
 */
export abstract class Card implements Base<(Canvas | Stack), null>,
  Draggable, Droppable, Selectable {

  uuid: string = v4();
  created: DateTime = DateTime.local();
  modified: DateTime = DateTime.local();
  parent: Canvas | Stack;
  children: null[] = [];
  filename: string;
  element: HTMLDivElement = document.createElement('div');
  header: HTMLDivElement = document.createElement('div');
  title: HTMLSpanElement = document.createElement('span');
  saveButton: HTMLButtonElement = document.createElement('button');
  closeButton: HTMLButtonElement = document.createElement('button');

  expandButton: HTMLButtonElement = document.createElement('button');
  shrinkButton: HTMLButtonElement = document.createElement('button');
  cardX: string;
  cardY: string;

  /**
   * Default constructor for creating a blank card with standard interaction controls.
   * @param parent A canvas or stack instance that will contain the new card.
   * @param filename A valid filename or path to associate with the new card.
   */
  constructor(parent: Canvas | Stack, filename: string) {
    this.parent = parent;
    this.filename = filename;
    this.element.setAttribute('class', 'card');
    this.element.setAttribute('id', this.uuid);
    this.header.setAttribute('class', 'card-header');
    this.title.innerHTML = 'My Card';
    this.saveButton.setAttribute('class', 'save');
    $(this.saveButton).on('click', () => this.save());
    $(this.saveButton).hide();
    this.closeButton.setAttribute('class', 'close');
    $(this.closeButton).on('click', () => this.destructor());

    this.expandButton.setAttribute('class', 'expand');
    $(this.expandButton).click(() => this.expand());

    this.shrinkButton.setAttribute('class', 'shrink');
    $(this.shrinkButton).click(() => this.shrink());
    // let clock = new Clock("Smu", 1000, 10);
    // clock.onClockTick.subscribe((c, n) => console.log(`${c.name} ticked ${n} times.`));

    this.header.appendChild(this.title);
    this.header.appendChild(this.saveButton);
    this.header.appendChild(this.closeButton);
    this.header.appendChild(this.expandButton);
    this.element.appendChild(this.header);

    if (this.parent instanceof Canvas) this.parent.add(this);
    if (this.parent instanceof Stack) this.parent.add(this);
    $(this.element).css({
      transform: 'none',
      top: this.element.offsetTop - (this.element.offsetHeight / 2),
      left: this.element.offsetLeft - (this.element.offsetWidth / 2)
    });
    this.cardX = String(this.element.style.left);
    this.cardY = String(this.element.style.top);

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
    this.parent.remove(this);
    // const event = new CustomEvent('destruct', { detail: this.uuid });
    // document.dispatchEvent(event);
  }

  /**

   * Abstract placeholder for loading content from local or remote sources.
   */
  abstract load(): void;

  /**
   * Abstract placeholder for writing content to local or remote sources.
   */
  abstract save(): void;

   * Used to expand card to full screen view.
   */
  expand(): void {
    this.header.removeChild(this.expandButton);
    this.header.appendChild(this.shrinkButton);

    this.cardX = String(this.element.style.left);
    this.cardY = String(this.element.style.top);

    this.element.style.top = "0px";
    this.element.style.left = "0px";

    this.element.style.height = String(100+"%");
    this.element.style.width = String(100+"%");
    //this.expandButton.style.right = "10%";
  }

  /**
   * Returns card to default size.
   */
  shrink(): void{
    this.header.removeChild(this.shrinkButton);
    this.header.appendChild(this.expandButton);

    this.element.style.height = "280px";
    this.element.style.width = "200px";

    this.element.style.top = this.cardY;
    this.element.style.left = this.cardX;
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
          const uuids: string[] = [];
          $('.ui-selected').map((_, s) => uuids.push($(s).attr('id') as string));
          const cards = uuids.map((uuid) => canvas.search(uuid).pop() as Card);
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

    const aContextMenu: Menu = remote.Menu.buildFromTemplate(menuOptions);
    aContextMenu.popup({});
  }

}
