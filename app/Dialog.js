"use strict";
const Error = require('../lib/error.js');
const Utility = require('../lib/utility.js');

module.exports = {

  // non-modal, non-interactive dialog for application notices
  notice: ({
    height = '300px',
    width = '400px',
    context = Error.throwIfMissing('context')
  } = {}) => {
    const overlay = document.createElement('div');
    $(overlay).attr('class', 'overlay');

    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);
    $(dialog).css('z-index', Utility.getHighestZIndex('div') + 1);

    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(() => { $(overlay).remove(); });

    dialog.appendChild(closeButton);
    overlay.appendChild(dialog);
    context.appendChild(overlay);
    return dialog;
  },

  // generic dialog for interactive dialogs that are modal by default
  dialog: ({
    height = '300px',
    width = '400px',
    context = Error.throwIfMissing('context'),
    modal = true
  } = {}) => {
    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);
    $(dialog).css('z-index', Utility.getHighestZIndex('div') + 1);

    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(() => { $(dialog).remove(); });

    dialog.appendChild(closeButton);
    context.appendChild(dialog);

    if (modal) $(dialog).draggable({
      containment: 'window',
      start: function() {
        $(this).css({
          transform: 'none',
          top: $(this).offset().top+'px',
          left: $(this).offset().left+'px'
        });
      }
    });

    return dialog;
  },

}
