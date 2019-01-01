import { Canvas } from './Canvas';
// import { FileTypeDispatcher } from './fs/handlers';

class AppManager {

  private static _instance: AppManager;
  public canvasList: Canvas[];

  private constructor() {
    this.canvasList = new Array();
  }

  public static get Instance(): AppManager {
    return this._instance || (this._instance = new this());
  }

  public get current(): Canvas {
    return this.canvasList[this.canvasList.length - 1];
  }

  public newCanvas(): Canvas {
    this.canvasList.push(new Canvas([]));
    return this.current;
  }

}

export const AppManagerInstance = AppManager.Instance;
