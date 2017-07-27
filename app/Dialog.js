module.exports = {

  dialog: ({height = '300px', width = '400px', modal = false} = {}) => {
    const dialog = document.createElement('div');
    $(dialog).attr('class', 'dialog').height(height).width(width);
    const closeButton = document.createElement('button');
    $(closeButton).attr('class', 'close');
    $(closeButton).click(function() {this.closest('.dialog').remove();});
    dialog.appendChild(closeButton);
    document.body.appendChild(dialog);
    return dialog;
  },

}
