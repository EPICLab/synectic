"use strict";
// require('./libs/ace/ext-modelist.js'); // Don't delete me! Needed by ace.req
const Card = require('../app/Card.js');

module.exports = class CodeEditor extends Card {
  constructor(type, fileData) {
    super(type, fileData);
    this.type = type;
    this.faces = [];
    this.editors = [];
    this.buildMetadata('codeEditor');

    this.ontent = document.createElement('div');
    $(this.content).attr('class', 'codeEditor');

    for (let i = 0; i < 3; i++) {
      this.face = document.createElement('div');
      if (i == 2)
        this.faceEditor = document.createElement('div');
      else
        this.faceEditor = document.createElement('textarea');
      this.face.appendChild(this.faceEditor);
      this.faces.push(this.face);
    }
  }
}
