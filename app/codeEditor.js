"use strict";
var Card = require('../app/Card.js');
// require('./libs/ace/ext-modelist.js'); // Don't delete me! Needed by ace.req

module.exports = class CodeEditor extends Card {
  constructor(type) {
    super(type);
    this.type = type;
    this.faces = [];
    this.editors = [];

    this.content = document.createElement('div');
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
