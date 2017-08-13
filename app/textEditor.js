"use strict";
var Card = require('../app/Card.js');

module.exports = class TextEditor extends Card{
  constructor(type) {
    super(type);
    this.type = type;
    this.faces = [];
    this.editors = [];

    this.content = document.createElement('div');
    $(this.content).attr('class', 'textEditor');

    for (let i = 0; i < 3; i++) {
      this.face = document.createElement('div');
      if (i == 2) //3rd card face is metadata
        this.faceEditor = document.createElement('div');
      else { //1st and 2nd card faces are textareas
        this.faceEditor = document.createElement('textarea');
        this.editors.push(this.faceEditor);
      }

      this.face.appendChild(this.faceEditor);
      this.faces.push(this.face);
    }
  }
}
