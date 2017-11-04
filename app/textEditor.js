"use strict";
var Card = require('../app/Card.js');
var markd = require("simplemde")
var markdToolbar = require("./../lib/MDEToolbar")
module.exports = class TextEditor extends Card {
  constructor(type) {
    super(type);
    this.type = type;
    this.faces = [];
    this.editors = [];
    this.MDEs = [];

    this.content = document.createElement('div');
    $(this.content).attr('class', 'textEditor');
    for (let i = 0; i < 3; i++) {
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
      $("#body_" + this.id).append(this.editors[i]);
      if (i != 2)
        this.MDEs.push(this.initMDE(i));
      this.faces.push(this.face);
    }
  }
  initMDE(i) {
    let MDE = new markd({
      element: document.getElementById("card_" + this.id + "_textEditor_" + i),
      toolbar: markdToolbar
    });
    $(this.body).on("mouseenter", () => {
      if (MDE.isPreviewActive())
        MDE.togglePreview()
    });
    $(this.body).on("mouseleave", () => {
      if (!MDE.isPreviewActive())
        MDE.togglePreview()
    });
    return MDE;
  }
}