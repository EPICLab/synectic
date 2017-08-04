const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const menus = require('./app/Menu.js');

let win;

function createWindow() {
  win = new BrowserWindow({ width: 1200, height: 1000 });
  win.__name = 'main_window';
  win.__tag = 'main';

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'lib/index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  if (process.platform === 'darwin') menus.configDarwinMenu();
  const menu = Menu.buildFromTemplate(menus.template);
  Menu.setApplicationMenu(menu);

  // Open the DevTools.
  // win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
