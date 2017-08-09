"use strict";
const Card = require('../app/Card.js');

module.exports = class SketchPad extends Card {
  constructor(type, name) {
    super(type, name);
    this.type = type;
    this.faces = [];
    this.sketches = [];
    this.pens = [];

    this.content = document.createElement('div');
    $(this.content).attr('class', 'sketchEditor');

    for (let i = 0; i < 3; i++) {
      this.face = document.createElement('div');
      this.faceEditor = document.createElement('div');
      this.face.appendChild(this.faceEditor);
      this.faces.push(this.face);
    }

      this.addButtons();
  }

  addButtons() {
    let red = document.createElement('button');
    let blue = document.createElement('button');
    let green = document.createElement('button');
    let black = document.createElement('button');
    let erase = document.createElement('button');
    let colors = ['red', 'blue', 'green', 'black'];
    let cur = this;
    $([red, blue, green, black]).each(function (idx) {
      $(this).addClass('colorBtn').attr({
        id: 'pen_' + colors[idx] + cur.id,
        value: colors[idx],
      }).css({
        backgroundColor: colors[idx],
      });
      $(cur.card).find('.sketchEditor').append(this);
      cur.pens.push($(this)[0]);
    });

    $(erase).attr('class', 'eraser');
    $(cur.card).find('.sketchEditor').append(erase);
  }
}
