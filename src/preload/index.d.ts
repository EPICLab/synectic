import { ElectronAPI } from '@electron-toolkit/preload';
import { PreloadAPI } from '../preload/index';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: PreloadAPI;
  }
}
