"use strict";
var Card = require('../app/Card.js');
var markd = require("simplemde")

module.exports = class TextEditor extends Card {
  constructor(type) {
    super(type);
    this.type = type;
    this.faces = [];
    this.editors = [];

    this.content = document.createElement('div');
    $(this.content).attr('class', 'textEditor');
    for (let i = 0; i < 1; i++) {
      this.face = document.createElement('div');
      if (i == 2) //3rd card face is metadata
        this.faceEditor = document.createElement('div');
      else { //1st and 2nd card faces are textareas
        this.faceEditor = document.createElement('textarea');
        $(this.faceEditor).attr({
          class: 'editor',
          id: "card_" + this.id + '_textEditor_' + i,
          rows: 19,
          cols: 200,
        })
        this.editors.push(this.faceEditor);
      }
      // this.face.append(this.faceEditor);
      this.faces.push(this.face);
    }
    $("#body_" + this.id).append(this.editors[0])
    let f = new markd({
      element: document.getElementById("card_1_textEditor_0")
    });
  }
}