import { dialog, ipcMain } from 'electron';

// Handle renderer requests for Electron `showOpenDialog` and returns filepath results.
ipcMain.handle('fileOpenDialog', async (_event, properties) => {
  return await dialog.showOpenDialog({ properties: [...properties, 'multiSelections'] });
});

// Handle renderer requests for Electron `showSaveDialog` and returns the results value.
ipcMain.handle('fileSaveDialog', async (_event, { defaultPath, buttonLabel, properties }) => {
  return await dialog.showSaveDialog({ defaultPath, buttonLabel, properties });
});
