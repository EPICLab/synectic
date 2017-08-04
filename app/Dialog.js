"use strict";

module.exports = {

  // non-modal, non-interactive dialog for application notices
  notice: ({
    height = '300px',
    width = '400px'
  } = {}) => {
    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);

    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(function() { this.closest('.dialog').remove(); });

    dialog.appendChild(closeButton);
    document.body.appendChild(dialog);
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
    $(closeButton).click(function() { this.closest('.dialog').remove(); });

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
