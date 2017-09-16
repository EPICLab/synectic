"use strict";
const BrowserWindow = require('electron').BrowserWindow;
const Utility = require('../lib/utility.js');

function other() {
  // do nothing for now
}

Utility.defineConstant(module.exports, 'template', [{
    label: 'Edit',
    submenu: [{
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'pasteandmatchstyle'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      }
    ]
  },
  {
    label: 'View',
    submenu: [{
        role: 'reload'
      },
      {
        role: 'forcereload'
      },
      {
        role: 'toggledevtools'
      },
      {
        type: 'separator'
      },
      {
        role: 'resetzoom'
      },
      {
        role: 'zoomin'
      },
      {
        role: 'zoomout'
      },
      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    label: 'Control',
    submenu: [{
        label: 'Switch Canvas',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'New Canvas',
        accelerator: 'Cmd+M',
        click() {
          AppManager.addCanvas();
        }
      },
      {
        label: 'New Card',
        accelerator: 'Cmd+N',
        click() {
          AppManager.current.addCard('text', true);
        }
      },
      {
        label: 'New Group',
        click() {
          BrowserWindow.fromId(1).webContents
            .executeJavaScript(Utility.getFunctionBody(other));
        }
      },
    ]
  },
  {
    role: 'window',
    submenu: [{
        role: 'minimize'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    role: 'help',
    submenu: [{
        label: 'Learn More',
        click() {
          const shell = require('electron').shell;
          shell.openExternal('https://github.com/nelsonni/synectic');
        }
      },
      {
        label: 'About Synectic',
        click() {
          AppManager.current.displayVersion();
        }
      }
    ]
  }
]);

module.exports.configDarwinMenu = function() {
  this.template.unshift({
    label: "Synectic IDE",
    submenu: [{
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })

  // Edit menu
  this.template[1].submenu.push({
    type: 'separator'
  }, {
    label: 'Speech',
    submenu: [{
        role: 'startspeaking'
      },
      {
        role: 'stopspeaking'
      }
    ]
  })

  // Window menu
  this.template[4].submenu = [{
      role: 'close'
    },
    {
      role: 'minimize'
    },
    {
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      role: 'front'
    }
  ]
};