import { app, BrowserWindow } from 'electron';
import { setContentSecurityPolicy } from './fs/contentSecurityPolicy';
declare var __dirname: string;
let mainWindow: Electron.BrowserWindow;

function onReady() {
  setContentSecurityPolicy();

  mainWindow = new BrowserWindow({
    height: 1000,
    width: 1200,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: true
    }
  });

  const fileName = `file://${__dirname}/index.html`;
  mainWindow.loadURL(fileName);
  mainWindow.on('close', () => app.quit());
}

function onClose() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}

app.on('ready', () => onReady());
app.on('window-all-closed', () => onClose());
app.on('activate', () => onReady());
