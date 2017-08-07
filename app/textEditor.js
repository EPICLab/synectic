"use strict";
const VERTICAL_PADDING = 30;
const Card = require('../app/Card.js');

module.exports = class TextEditor extends Card{
  constructor(type) {
    super(type);
    this.type = type;
    this.faces = [];
    this.editors = [];
    this.contentBuilder(this.card);
  }

  contentBuilder(card) {
    var content = document.createElement('div');
    $(content).attr({
      class: 'editor',
      id: card.id + '_editor_' + this.id,
    });
    let cur = this;
    for (let i = 0; i < 3; i++) {
      let face = document.createElement('div');
      if (i == 2) //3rd card face is metadata
        var faceEditor = document.createElement('div');
      else { //1st and 2nd card faces are textareas
        var faceEditor = document.createElement('textarea');
        this.editors.push(faceEditor);
      }

      face.appendChild(faceEditor);
      this.faces.push(face);
    }

    this.faces.forEach((element, idx) => {
      $(element.firstChild).attr({
          class: 'editor',
          id: card.id + 'codeEditor_' + idx,
          rows: 19,
          cols: 200,
        })
        .on('change', () => cur.updateMetadata('codeEditor'))
        .select(() => this.exportCard(window.getSelection().toString()))
      content.appendChild(element);
    });
  }
}
