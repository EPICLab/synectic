// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  OpenDialogOptions,
  SaveDialogOptions,
  clipboard,
  contextBridge,
  ipcRenderer,
  shell
} from 'electron';
import path from 'path';
import { randomUUID, randomBytes, createHash } from 'crypto';
import * as io from './containers/io';
import * as git from './containers/git';
import { performance } from 'perf_hooks';

const fileOpenDialog = async (
  options: OpenDialogOptions
): Promise<Electron.OpenDialogReturnValue> => await ipcRenderer.invoke('fileOpenDialog', options);

const fileSaveDialog = async (
  options: SaveDialogOptions
): Promise<Electron.SaveDialogReturnValue> => await ipcRenderer.invoke('fileSaveDialog', options);

const checkContext = async (): Promise<string> => await ipcRenderer.invoke('context');

const randomSHA1 = () => {
  const randomString = randomBytes(16).toString('hex');
  return createHash('sha1').update(randomString).digest('hex');
};

const PreloadAPI = {
  globals: {
    sep: path.sep,
    platform: process.platform
  },
  dialogs: {
    fileOpen: fileOpenDialog,
    fileSave: fileSaveDialog
  },
  clipboard: clipboard,
  fs: {
    cwd: process.cwd,
    dirname: path.dirname,
    join: path.join,
    relative: path.relative,
    normalize: path.normalize,
    ...io
  },
  git,
  perfTime: performance.now,
  notifications: {
    sendNotification: (message: string) => {
      ipcRenderer.send('notify', message);
    }
  },
  context: checkContext,
  uuid: randomUUID,
  hash: randomSHA1,
  openExternal: shell.openExternal
} as const;

contextBridge.exposeInMainWorld('api', PreloadAPI);

declare global {
  interface Window {
    api: typeof PreloadAPI;
  }
}
