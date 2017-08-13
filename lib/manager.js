"use strict";
const singleton = Symbol();
const singletonEnforcer = Symbol();
const Canvas = require('../app/Canvas.js');

let canvasStack;

class CanvasManager {
  constructor(enforcer) {
    if (enforcer !== singletonEnforcer) {
      throw new Error('Cannot construct singleton');
    }

    canvasStack = new Array();
    this._type = 'CanvasManager';
  }

  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new CanvasManager(singletonEnforcer);
    }
    return this[singleton];
  }

  register(canvas = new Canvas()) {
    canvasStack.push(canvas);
    console.log('canvasStack size: ' + canvasStack.length);
    return canvas;
  }

  get current() {
    if (canvasStack.length < 1) {
      throw new Error('CanvasManager is empty');
    }
    return canvasStack[canvasStack.length-1];
  }

  get size() {
    return canvasStack.length;
  }

  printCanvasStack() {
    console.log('canvasStack: [' + canvasStack + ']');
  }

  get type() {
    return this._type;
  }

  set type(value) {
    this._type = value;
  }
}

module.exports = CanvasManager.instance;
