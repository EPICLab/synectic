"use strict";

module.exports = {

  notice: ({
    height = '300px',
    width = '400px',
    modal = false
  } = {}) => {
    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);
    if (modal) $(dialog).draggable();
    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(function() { this.closest('.dialog').remove(); });
    dialog.appendChild(closeButton);
    document.body.appendChild(dialog);
    return dialog;
  },

  warning: ({
    height = '200px',
    width = '300px',
    modal = true
  } = {}) => {
    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);
    if (modal) $(dialog).draggable({ containment: 'window' });
    const username = require('username');
    let creator = username.sync();
    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(function() { this.closest('.dialog').remove(); });
    // TODO: Add acknowledgment button to the bottom of the warning
    dialog.appendChild(closeButton);
    document.body.appendChild(dialog);
    return dialog;
  },

}
