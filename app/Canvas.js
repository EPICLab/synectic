const Dialog = require('../app/Dialog.js');

module.exports = class Canvas {
  constructor() {
    this.counter = 3;
  }

  incCounter() {
    this.counter++;
  }

  printCounter() {
    console.log(this.counter);
  }

  addObj() {
    Dialog.warning();
  };

  displayVersion() {
    let dialog = Dialog.notice();
    let remoteApp = require('electron').remote.app;

    const logo = document.createElement('img');
    const versionText = document.createElement('div');

    $(logo).attr('class', 'logo');
    $(versionText).attr('class', 'versions');
    $(versionText).html(
      remoteApp.getName() + ' ' + remoteApp.getVersion() + '<br/>' +
      '<span id=\'frameworks\'>' +
      'Node.js ' + process.versions.node + ', ' +
      'Chrome ' + process.versions.chrome + ', and ' +
      'Electron ' + process.versions.electron + '</span>'
    );

    dialog.appendChild(logo);
    dialog.appendChild(versionText);
  }
};
