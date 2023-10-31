import type {SaveDialogOptions, OpenDialogOptions} from 'electron';
import {ipcRenderer} from 'electron';

export const fileOpen = async (
  options: OpenDialogOptions,
): Promise<Electron.OpenDialogReturnValue> => await ipcRenderer.invoke('fileOpenDialog', options);

export const fileSave = async (
  options: SaveDialogOptions,
): Promise<Electron.SaveDialogReturnValue> => await ipcRenderer.invoke('fileSaveDialog', options);
