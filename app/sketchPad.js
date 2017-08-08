"use strict";
const Card = require('../app/Card.js');

module.exports = class SketchPad extends Card {
  constructor(type, name) {
    super(type, name);
    this.type = type;
    this.faces = [];
    this.sketches = [];
    this.pens = [];

    this.contentBuilder(this.card);
    // this.setDrawEffects();
    this.addButtons();
  }

  contentBuilder(card) {
    var content = document.createElement('div');
    $(content).attr({
      class: 'editor',
      id: card.id + '_editor_' + this.id,
    });
    for (let i = 0; i < 3; i++) {
      let face = document.createElement('div');
      let faceEditor = document.createElement('div');
      face.appendChild(faceEditor);
      this.faces.push(face);
    }

    this.faces.forEach(function (element, idx) {
      $(element.firstChild).attr({
        class: 'sketchEditor',
        id: card.id + 'sketch_' + idx,
      });
      content.appendChild(element);
    });
  }

  setDrawEffects() {
    let canvases = [];
    for (let i = 0; i < 3; i++)
      canvases.push('card_' + this.id + 'sketch_' + i);
    let curCard = this;
    $(canvases).each(function (idx) {
      let sketchPad = Raphael.sketchpad(canvases[idx], {
        height: '100%',
        width: '100%',
        editing: true,
      });
      curCard.sketches.push(sketchPad);
      sketchPad.change(() => curCard.updateMetadata('sketch'));
    });
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
      $(cur.card).find('.editor').append(this);
      cur.pens.push($(this)[0]);
    });

    $(erase).attr({
      id: 'pen_erase' + cur.id,
    }).addClass('eraser');

    $(cur.card).find('.editor').append(erase);

    $(erase).on('click', () => {
      for (let i in cur.sketches) {
        if (cur.sketches[i].getState().editing === true)
          cur.sketches[i].editing('erase');
        else
          cur.sketches[i].editing(true);
      };
    });
  }
}
