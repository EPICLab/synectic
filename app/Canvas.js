// require('jquery-ui');

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
    var block = document.createElement('div');
    $(block).attr('class', 'dialog');
    document.body.appendChild(block);
  };

  displayVersion() {
    var nodeVer = process.versions.node;
    var chromeVer = process.versions.chrome;
    var electronVer = process.versions.electron;
    var appVersion = require('electron').remote.app.getVersion();
    var appName = require('electron').remote.app.getName();
    // alert(
    //   appName + ' ' + appVersion + '\n' +
    //   'Using node ' + nodeVer +
    //   ', Chrome ' + chromeVer +
    //   ', and Electron ' + electronVer + '.'
    // );
    var appLogo = document.createElement('img');
    $(appLogo).attr('class', 'logo');
    var versionDialog = document.createElement('div');
    $(versionDialog).attr('class', 'dialog');
    // versionDialog.appendChild(appLogo);
    $(versionDialog).text(
      appName + ' ' + appVersion + '\n' +
        'using Node ' + nodeVer +
        ', Chrome ' + chromeVer +
        ', and Electron ' + electronVer + '.'
    );
    $(versionDialog).html($(versionDialog).html().replace(/\n/g,'<br/>'));
    document.body.appendChild(versionDialog);

    $('div.dialog').dialog({ width: 491, height: 436, modal: true });
  }
};
