"use strict";

module.exports = {

  // non-modal, non-interactive dialog for application notices
  notice: ({
    height = '300px',
    width = '400px'
  } = {}) => {
    const overlay = document.createElement('div');
    $(overlay).attr('class', 'overlay');

    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);

    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(() => { $(overlay).remove(); });

    dialog.appendChild(closeButton);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    return dialog;
  },

  // generic dialog for interactive dialogs that are modal by default
  dialog: ({
    height = '300px',
    width = '400px',
    modal = true
  } = {}) => {
    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);

    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(() => { $(dialog).remove(); });

    dialog.appendChild(closeButton);
    document.body.appendChild(dialog);

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
