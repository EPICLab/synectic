import { OpenDialogOptions, SaveDialogOptions, dialog, ipcMain, Notification } from 'electron';

// Handle renderer requests for Electron `showOpenDialog` and returns filepath results.
ipcMain.handle('fileOpenDialog', async (_, options: OpenDialogOptions) => {
  return await dialog.showOpenDialog(options);
});

// Handle renderer requests for Electron `showSaveDialog` and returns the results value.
ipcMain.handle('fileSaveDialog', async (_, options: SaveDialogOptions) => {
  return await dialog.showSaveDialog(options);
});

// Handle renderer requests for Electron `Notification` to display in OS-specific notifications.
ipcMain.on('notify', (_, message: string) => {
  new Notification({ title: 'Notification', body: message }).show();
});
