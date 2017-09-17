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
      $("#body_" + this.id).append(this.editors[0]);
      this.initMDE(i);
      this.faces.push(this.face);
    }
  }
  initMDE(i) {
    let MDE = new markd({
      element: document.getElementById("card_" + this.id + "_textEditor_" + i),
      toolbar: [{
        name: "Bold",
        action: markd.toggleBold,
        className: "fa fa-bold",
        title: "Bold",
      }, {
        name: "Italic",
        action: markd.toggleItalic,
        className: "fa fa-italic",
        title: "Italic"
      }, {
        name: "Code",
        action: markd.toggleCodeBlock,
        className: "fa fa-code",
        title: "Code"
      }, {
        name: "Generic List",
        action: markd.toggleUnorderedList,
        className: "fa fa-list-ul",
        title: "Generic List"
      }, {
        name: "Numbered List",
        action: markd.toggleOrderedList,
        className: "fa fa-list-ol",
        title: "Numbered List"
      }, {
        name: "Preview",
        action: markd.togglePreview,
        className: "fa fa-eye no-disable",
        title: "Preview"
      }]
    });
    MDE.codemirror.on("blur", () => {
      if (!event.relatedTarget && !MDE.isPreviewActive())
        MDE.togglePreview() // needed to gaurd against editor select
    })
    $(this.body).on("mouseenter", () => {
      if (MDE.isPreviewActive())
        MDE.togglePreview()
    });
    $(this.body).on("mouseleave", () => {
      if (!MDE.isPreviewActive())
        MDE.togglePreview()
    });
  }
}