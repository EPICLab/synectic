"use strict";
// require('./libs/ace/ext-modelist.js'); // Don't delete me! Needed by ace.req
const Card = require('../app/Card.js');

module.exports = class CodeEditor extends Card {
  constructor(type, fileData) {
    super(type, fileData);
    this.type = type;
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
    let faces = [];
    for (let i = 0; i < 3; i++) {
      let face = document.createElement('div');
      if (i == 2)
        var faceEditor = document.createElement('div');
      else
        var faceEditor = document.createElement('textarea');
      face.appendChild(faceEditor);
      faces.push(face);
    }

    faces.forEach(function(element, idx) {
      $(element.firstChild).attr({
        class: 'editor',
        id: card.id + 'codeEditor_' + idx,
      });
      content.appendChild(element);
    });

    // leave out last card so it can be used for metadata
    // this.initAce(faces.slice(0, faces.length - 1));

  }

  // initAce(faces) {
  //   let cur = this;
  //   $(faces).each(function(idx) {
  //     let editor = ace.edit(this.lastElementChild.id);
  //     // editor.setTheme('ace/theme/twilight');
  //     editor.setTheme('ace/theme/chrimson-editor');
  //     var modelist = ace.require('ace/ext/modelist');
  //     if (cur.fileExt != undefined) {
  //       var mode = modelist.getModeForPath(cur.fileExt).mode;
  //       editor.session.setMode(mode);
  //     }
  //     $(editor).on('change', () => cur.updateMetadata('codeEditor'))
  //       .click(() => editor.getCopyText() == "" ? $(".exportBtn").hide() :
  //         cur.exportCard(editor));
  //     $(".ace_text-input").on("keydown", () => editor.getCopyText() == "" ?
  //       null : cur.exportCard(editor))
  //     cur.editors.push(editor);
  //   });
  // }
}
