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
    let content = document.createElement('div');
    let logo = document.createElement('img');
    let versionText = document.createElement('span');
    let remoteApp = require('electron').remote.app;

    $(dialog).attr('class', 'dialog');
    $(content).attr('class', 'content');
    $(logo).attr('class', 'logo');
    $(versionText).html(
      remoteApp.getName() + ' ' + remoteApp.getVersion() + '<br/>' +
      'Node.js ' + process.versions.node + '<br/>' +
      'Chrome ' + process.versions.chrome + '<br/>' +
      'Electron ' + process.versions.electron
    );

    content.appendChild(logo);
    content.appendChild(versionText);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
  }
};
