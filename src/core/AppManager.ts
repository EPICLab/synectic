import { Canvas } from './Canvas';

class AppManager {

  private static _instance: AppManager;
  public canvasList: Canvas[];

  private constructor() {
    this.canvasList = new Array();
  }

  public static get Instance(): AppManager {
    return this._instance || (this._instance = new this());
  }

  public newCanvas(): Canvas {
    this.canvasList.push(new Canvas());
    return this.last();
  }

  public last(): Canvas {
    return this.canvasList[this.canvasList.length - 1];
  }
}

export const AppManagerInstance = AppManager.Instance;
