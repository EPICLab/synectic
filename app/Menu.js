"use strict";

define('template', [
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () {
          const BrowserWindow = require('electron').BrowserWindow;
          BrowserWindow.fromId(1).webContents.executeJavaScript(`document.querySelectorAll('.dialog').length`, function (result) {
            console.log('dialogs: ' + result);
          })
          showAllBrowserWindows();
        }
      },
      {
        label: 'Find BrowserWindows',
        click () {
          showAllBrowserWindows();
        }
      },
      {
        label: 'About Synectic',
        click () {
          const BrowserWindow = require('electron').BrowserWindow;
          BrowserWindow.fromId(1).webContents.executeJavaScript(`
            var Canvas = require('../app/Canvas.js');
            var canvas = new Canvas();
            canvas.displayVersion();
            `);
        }
      }
    ]
  }
]);

module.exports.configDarwinMenu = function () {
  const app = require('electron').app;
  this.template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  })

  // Edit menu
  this.template[1].submenu.push(
    {type: 'separator'},
    {
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  )

  // Window menu
  this.template[3].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
};

// helper function that displays all currently open BrowserWindow objects
function showAllBrowserWindows() {
  const BrowserWindow = require('electron').BrowserWindow;
  var windowObjectArray = BrowserWindow.getAllWindows();
  for (var i = 0, len = windowObjectArray.length; i < len; i ++) {
    var windowObject = windowObjectArray[i];
    console.log('window id: \t' + windowObject.id);
    console.log('name: \t\t' + windowObject.__name);
    console.log('tag: \t\t' + windowObject.__tag);
  }
}

// helper function for defining immutable constants
function define(name, value) {
  Object.defineProperty(module.exports, name, {
    value: value,
    enumerable: true
  });
}
