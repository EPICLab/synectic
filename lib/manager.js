"use strict";
const singleton = Symbol();
const singletonEnforcer = Symbol();
const Canvas = require('../app/Canvas.js');
const { Menu, MenuItem } = require('electron').remote;

let applicationMenu; // reference item for accessing the AppMenu entries
let canvasSelectionSubmenu; // reference item for accessing the AppMenu entries

let canvasList;
let currentCanvas;

class AppManager {
  constructor(enforcer) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }
    this._type = 'AppManager';
    canvasList = [];

    let menu = require('../app/AppMenu.js');
    if (process.platform === 'darwin') menu.configDarwinMenu();
    applicationMenu = Menu.buildFromTemplate(menu.template);
    canvasSelectionSubmenu = (process.platform !== 'darwin') ?
      applicationMenu.items[2].submenu.items[0].submenu :
      applicationMenu.items[3].submenu.items[0].submenu;
    Menu.setApplicationMenu(applicationMenu);
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new AppManager(singletonEnforcer);
    }
    return this[singleton];
  }

  get type() {
    return this._type;
  }

  get size() {
    return canvasList.length;
  }

  set current(canvas) {
    currentCanvas = canvas;
    this.updateCanvasSelected();
  }

  get current() {
    return currentCanvas;
  }

  addCanvas() {
    let canvas = new Canvas({id: this.nextCanvasId()});
    canvasList.push(canvas);

    let menuItem = new MenuItem({
      label: 'Canvas ' + canvas.id,
      accelerator: ('Cmd+' + canvas.id),
      type: 'checkbox',
      checked: false,
      uuid: canvas.uuid,
      click: (item) => {
        this.current = canvas;
      }
    });
    canvasSelectionSubmenu.append(menuItem);
    Menu.setApplicationMenu(applicationMenu);
    this.current = canvas;
    return canvas;
  }

  nextCanvasId() {
    let ids = canvasList.map((canvas) => {
      return canvas.id;
    });
    if (ids.length < 1) return 1; // no canvas exists in namespace

    let next = 1;
    while (ids.indexOf(next += 1) > -1);
    return next;
  }

  updateCanvasSelected() {
    canvasList.forEach((item) => {
      if (item.uuid === currentCanvas.uuid) {
        item.canvas.style.zIndex = 1000;
      } else {
        item.canvas.style.zIndex = 1;
      }
    });

    canvasSelectionSubmenu.items.forEach((item) => {
      if (item.uuid === currentCanvas.uuid) {
        item.checked = true;
      } else {
        item.checked = false;
      }
    });
  }
}

module.exports = AppManager.instance;
