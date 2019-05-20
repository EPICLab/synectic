import { Base } from './base';
import { Draggable, Droppable, Selectable, Flippable, OptionState, SplitMode } from './interaction';
import { Canvas } from './Canvas';
import { Stack } from './Stack';
import { v4 } from 'uuid';
import * as fs from 'fs-extra';
import { DateTime } from 'luxon';
import { hasClass, addClass, removeClass, toggleVisibility } from './helper';
import { Menu, remote } from 'electron';
import * as path from 'path';
import { Repository } from '../vcs/Repository';
import { Branch } from '../vcs/Branch';
import { BranchUI } from '../vcs/BranchUI';

/**
 * Template definition of a card; can be extended to support specific content.
 */
export abstract class Card implements Base<(Canvas | Stack), null>,
  Draggable, Droppable, Selectable, Flippable {

  // Metadata of the Card instance
  readonly uuid: string = v4();
  readonly created: DateTime = DateTime.local();
  modified: DateTime = DateTime.local();
  parent: Canvas | Stack;
  children: null[] = [];

  // UI elements of the Card instance
  element: HTMLDivElement = document.createElement('div');
  position: [string, string] = ['0','0'];
  front: HTMLDivElement = document.createElement('div');
  back: HTMLDivElement = document.createElement('div');
  header: HTMLDivElement = document.createElement('div');
  title: HTMLSpanElement = document.createElement('span');
  buttons: Map<string, HTMLButtonElement> = new Map();

  // File elements and associated metadata
  filepath: fs.PathLike;
  loading: HTMLDivElement = document.createElement('div');
  watcher: fs.FSWatcher | undefined;

  // VCS elements and associated metadata
  repository: Repository | undefined;
  branch: Branch | undefined;
  branchUI: BranchUI | undefined;
  fetchButton: HTMLButtonElement | undefined;

  /**
   * Default constructor for creating a blank card with standard interaction controls.
   * @param parent A canvas or stack instance that will contain the new card.
   * @param filepath A valid filename or path to associate with the new card.
   */
  constructor(parent: Canvas | Stack, filepath: fs.PathLike) {
    this.parent = parent;
    this.filepath = filepath;
    this.element.setAttribute('class', 'card');
    this.element.setAttribute('id', this.uuid);
    this.front.setAttribute('class', 'front');
    this.back.setAttribute('class', 'back');
    this.header.setAttribute('class', 'card-header');

    this.title.innerHTML = path.basename(filepath.toString());
    this.header.appendChild(this.title);
    this.addButton('saveButton', () => this.save(), 'save', false);
    this.addButton('expandButton', () => this.resize(), 'expand', true);
    this.addButton('shrinkButton', () => this.resize(), 'shrink', false);
    this.addButton('leftSplitButton', () => this.split(SplitMode.left), 'leftSplit', false);
    this.addButton('rightSplitButton', () => this.split(SplitMode.right), 'rightSplit', false);
    this.addButton('flipButton', () => this.flip(), 'flip', true);
    this.addButton('closeButton', () => this.destructor(), 'close', true);
    this.front.appendChild(this.header);
    this.element.appendChild(this.front);
    this.element.appendChild(this.back);

    document.addEventListener('fetch', e => console.log(`fetch event found: ${e}`));

    global.Synectic.GitManager.get(filepath).then(async (repository: Repository) => {
      this.repository = repository;
      this.branch = await repository.getBranch(filepath);
      this.branchUI = new BranchUI(this.repository, this.branch);
      const menu = await this.branchUI.getMenu();
      this.back.appendChild(menu.menu);

      menu.optionsArray().forEach(option => {
        option.onclick = async () => {
          if (this.repository && this.branch && this.branchUI) {
            const relativePath = path.relative(this.branch.root.toString(), this.filepath.toString());
            this.branch = await this.repository.getBranch(this.filepath, option.id);
            this.filepath = path.resolve(this.branch.root.toString(), relativePath);
            await this.branchUI.setBranch(this.branch);
            this.load(this.filepath);
          }
        };
      });

      const repoButtons = await this.branchUI.getRepoButtons();
      this.back.appendChild(repoButtons.fetch);
      repoButtons.fetch.onclick = async () => {
        if (this.branch) console.info(await this.branch.fetch());
      };
      this.back.appendChild(repoButtons.pull);
      repoButtons.pull.onclick = async () => {
        if (this.branch) console.info(await this.branch.pull());
      };
      this.back.appendChild(repoButtons.push);
      repoButtons.push.onclick = async () => {
        if (this.branch) console.info(await this.branch.push());
      };
    });

    this.loading.setAttribute('class', 'loading-img');
    this.front.appendChild(this.loading);
    toggleVisibility(this.loading, false);

    if (this.parent instanceof Canvas) this.parent.add(this);
    if (this.parent instanceof Stack) this.parent.add(this);
    $(this.element).css({
      top: this.element.offsetTop - (this.element.offsetHeight / 2),
      left: this.element.offsetLeft - (this.element.offsetWidth / 2)
    });
    if (this.element.style.left !== null && this.element.style.top !== null) {
      this.position = [this.element.style.left, this.element.style.top];
    }

    this.draggable(OptionState.enable);
    this.droppable(OptionState.enable);
    this.selectable(OptionState.enable);
    this.flippable(OptionState.enable);
  }

  /**
   * Default destructor for detaching from parent and dispatching a 'destruct' event; does not destroy instance.
   */
  destructor(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.parent.remove(this);
  }

  /**
   * Abstract placeholder for reading local file content into card.
   */
  abstract load(filepath: fs.PathLike): void;

  /**
   * Abstract placeholder for writing content to local or remote sources.
   */
  abstract save(): void;

  /**
   * Animation for expanding or contracting the card between fullscreen and
   * normal mode. Fullscreen mode disables drag, drop, select, and flip
   * functionality.
   */
  resize(): void {
    if (!this.element.classList.contains('fullscreen')) {
      if (this.element.style.left !== null && this.element.style.top !== null) {
        this.position = [this.element.style.left, this.element.style.top];
      }
    }
    this.element.classList.toggle('fullscreen');

    if (this.element.classList.contains('fullscreen')) {
      $(this.element).css({
        top: '0px',
        left: '0px'
      });
      this.toggleButton('expandButton', false);
      this.toggleButton('shrinkButton', true);
      this.toggleButton('leftSplitButton', true);
      this.toggleButton('rightSplitButton', true);
      this.toggleButton('flipButton', false);
      this.draggable(OptionState.disable);
      this.droppable(OptionState.disable);
      this.selectable(OptionState.disable);
      this.flippable(OptionState.disable);
    } else {
      $(this.element).css({
        left: this.position[0],
        top: this.position[1]
      });
      this.element.classList.remove('split_left');
      this.element.classList.remove('split_right');
      this.toggleButton('expandButton', true);
      this.toggleButton('shrinkButton', false);
      this.toggleButton('leftSplitButton', false);
      this.toggleButton('rightSplitButton', false);
      this.toggleButton('flipButton', true);
      this.draggable(OptionState.enable);
      this.droppable(OptionState.enable);
      this.selectable(OptionState.enable);
      this.flippable(OptionState.enable);
    }
  }

  /**
   * Animation for switching from fullscreen mode to split-screen mode.
   * Fullscreen mode must be enabled before split-screen mode can be enabled.
   * @param mode A SplitMode to select left or right side of screen.
   */
  split(mode: SplitMode): void {
    if (this.element.classList.contains('fullscreen')) {
      this.element.style.top = '';
      this.element.style.left = '';
      this.element.style.right = '';

      switch (mode) {
      case SplitMode.left:
        this.element.classList.remove('split_right');
        this.element.classList.add('split_left');
        break;
      case SplitMode.right:
        this.element.classList.remove('split_left');
        this.element.classList.add('split_right');
        break;
      }
      this.draggable(OptionState.disable);
      this.droppable(OptionState.disable);
      this.selectable(OptionState.disable);
      this.flippable(OptionState.disable);
    }
  }

  /**
   * Animation for flipping the card face between front and back content.
   * Flippable must be enabled on card prior to calls to flip.
   */
  private flip(): void {
    if (this.element.classList.contains('ui-flippable')) {
      if (this.element.classList.toggle('flipped')) {
        if (this.back.firstChild !== null) {
          this.back.insertBefore(this.header, this.back.firstChild);
        } else {
          this.back.appendChild(this.header);
        }
      } else {
        if (this.front.firstChild !== null) {
          this.front.insertBefore(this.header, this.front.firstChild);
        } else {
          this.front.appendChild(this.header);
        }
      }
    }
  }

  /**
   * Create and append new HTMLButtonElement objects to header.
   * @param key Reference key for managing added button in buttons map.
   * @param onClickCallback A callback function for handling button click events.
   * @param cssClass Optional CSS class for setting button appearance.
   * @param visibility Optional setting for hiding/showing button (default is to show the new button).
   * @return String key for new button (provided for chaining functions).
   */
  protected addButton(key: string, onClickCallback: () => any, cssClass?: string, visibility: boolean = true): string {
    const button = document.createElement('button');
    if (cssClass) button.setAttribute('class', cssClass);
    $(button).on('click', onClickCallback);
    if (!visibility) $(button).hide();

    this.header.appendChild(button);
    this.buttons.set(key, button);
    return key;
  }

  /**
   * Toggle the show/hide visiblity state of a specific button. Explicit state
   * may be set through optional second parameter.
   * @param key Reference key to a previously added button in the buttons map.
   * @param visiblity Optional setting for explicitly setting show/hide state (true is show, false is hide).
   */
  toggleButton(key: string, visibility?: boolean): void {
    const button = this.buttons.get(key);
    if (button) toggleVisibility(button, visibility);
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
        },
        stop: function() {
          $(this).css({ transform: '' });
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
   * Configuration for enabling/disabling flippable interaction.
   * @param opt A OptionState to enable or disable flippable interactions for this card.
   */
  flippable(opt: OptionState): void {
    if (opt === OptionState.enable) {
      this.element.classList.add('ui-flippable');
    } else if (opt === OptionState.disable) {
      this.element.classList.remove('ui-flippable');
    }
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
