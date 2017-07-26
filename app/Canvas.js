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

  testJQ() {
    console.log(window.jqueryui);
  }

  addObj() {
    let block = document.createElement('div');
    $(block).attr('class', 'overlay');
    document.body.appendChild(block);
  };

  displayVersion() {
    let dialog = document.createElement('div');
    let logo = document.createElement('img');
    let versionText = document.createElement('div');
    let remoteApp = require('electron').remote.app;

    $(dialog).attr('class', 'dialog');
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
    document.body.appendChild(dialog);
  }
};
