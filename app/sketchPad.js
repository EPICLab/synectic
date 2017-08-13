"use strict";
var Card = require('../app/Card.js');
var Raphael = require('raphael');

module.exports = class SketchPad extends Card {
  constructor(type) {
    super(type);
    this.type = type;
    this.faces = [];
    this.pens = [];

    this.content = document.createElement('div');
    $(this.content).attr('class', 'sketchEditor');

    for (let i = 0; i < 3; i++) {
      this.face = document.createElement('div');
      this.faceEditor = document.createElement('div');
      this.face.appendChild(this.faceEditor);
      this.faces.push(this.face);
    }

  }
}
