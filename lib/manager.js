"use strict";
const singleton = Symbol();
const singletonEnforcer = Symbol();
const Canvas = require('../app/Canvas.js');
if (process.env.NODE_ENV != "test") {
  var {
    Menu,
    MenuItem
  } = require('electron').remote;
} else {
  console.log(app.electron.remote)
  var Menu = app.electron.remote.Menu
  const MenuItem = app.electron.remote.MenuItem
}


let applicationMenu;
let canvasSelectionSubmenu;


let canvasList;
let currentCanvas;
let logs;

class AppManager {
  constructor(enforcer) {
    this.loggers = loggers
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }
    this._type = 'AppManager';
    canvasList = new Array();

    let menu = require('../app/AppMenu.js');
    if (process.platform === 'darwin') menu.configDarwinMenu();
    if (process.env.NODE_ENV == "test")
      applicationMenu = Menu.buildFromTemplate(menu.template).then(function() {
        canvasSelectionSubmenu = applicationMenu.items[3].submenu.items[0].submenu;
        Menu.setApplicationMenu(applicationMenu);
      });
    else {
      applicationMenu = Menu.buildFromTemplate(menu.template);
      canvasSelectionSubmenu = applicationMenu.items[3].submenu.items[0].submenu;
      Menu.setApplicationMenu(applicationMenu);
    }
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

  set testCurrent(canvas) {
    currentCanvas = canvas;
  }

  get current() {
    return currentCanvas;
  }
  set testAddCanvas(canvas) {
    canvasList.push(canvas);
    this.testCurrent = canvas;
    return canvas;
  }

  addCanvas() {
    let canvas = new Canvas({
      id: this.nextCanvasId()
    });
    canvasList.push(canvas);

    let menuItem = new MenuItem({
      label: 'Canvas ' + canvas.id,
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