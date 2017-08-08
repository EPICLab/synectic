"use strict";
// require('./libs/ace/ext-modelist.js'); // Don't delete me! Needed by ace.req
const Card = require('../app/Card.js');

module.exports = class CodeEditor extends Card {
  constructor(type, fileData) {
    super(type, fileData);
    this.type = type;
    this.faces = [];
    this.editors = [];
    this.contentBuilder(this.card);
    this.buildMetadata('codeEditor');
  }

  contentBuilder(card) {
    var content = document.createElement('div');
    $(content).attr({
      class: 'editor',
      id: card.id + '_editor_' + this.id,
    });
    for (let i = 0; i < 3; i++) {
      let face = document.createElement('div');
      if (i == 2)
        var faceEditor = document.createElement('div');
      else
        var faceEditor = document.createElement('textarea');
      face.appendChild(faceEditor);
      this.faces.push(face);
    }

    this.faces.forEach(function(element, idx) {
      $(element.firstChild).attr({
        class: 'editor',
        id: card.id + 'codeEditor_' + idx,
      });
      content.appendChild(element);
    });
  }
}
