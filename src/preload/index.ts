import { electronAPI } from '@electron-toolkit/preload';
import { createHash, randomBytes, randomUUID } from 'crypto';
import {
  OpenDialogOptions,
  SaveDialogOptions,
  clipboard,
  contextBridge,
  ipcRenderer,
  shell
} from 'electron';
import path from 'path';
import * as git from './git';
import * as io from './io';
import * as utils from './utils';

// Custom APIs for renderer
const api = {
  uuid: randomUUID,
  hash: (): string => {
    const randomString = randomBytes(16).toString('hex');
    return createHash('sha1').update(randomString).digest('hex');
  },
  globals: {
    sep: path.sep,
    platform: process.platform
  },
  dialogs: {
    fileOpen: async (options: OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> =>
      await ipcRenderer.invoke('fileOpenDialog', options),
    fileSave: async (options: SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> =>
      await ipcRenderer.invoke('fileSaveDialog', options)
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
  notifications: {
    sendNotification: (message: string) => {
      ipcRenderer.send('notify', message);
    }
  },
  openExternal: shell.openExternal,
  perfTime: performance.now,
  utils
};

export type PreloadAPI = typeof api;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
