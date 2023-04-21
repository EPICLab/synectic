// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge } from 'electron';
import child_process from 'child_process';
import path from 'path';
import { randomUUID } from 'crypto';

try {
  console.log('preload.ts can access __dirname:', __dirname);
} catch (error) {
  console.error('preload.ts cannot access __dirname:', error);
}

console.log('preload.ts can import node modules:', { child_process, path });

const command = (name: string) =>
  setTimeout(() => {
    const isRenderer = typeof process === 'undefined' || !process || process.type === 'renderer';
    console.log(`foo for ${name} [${isRenderer ? 'renderer' : 'main'}]`);
  }, 300);

const PreloadAPI = {
  child_process,
  join: path.join,
  test: command,
  uuid: randomUUID
} as const;

contextBridge.exposeInMainWorld('api', PreloadAPI);

declare global {
  interface Window {
    api: typeof PreloadAPI;
  }
}
