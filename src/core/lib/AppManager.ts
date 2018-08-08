import { Canvas } from './Canvas';
import { asyncReadFile } from '../fs/io';
import { jsonToMap } from '../fs/mapper';
// import { FileTypeDispatcher } from './fs/handlers';

class AppManager {

  private static _instance: AppManager;
  public canvasList: Canvas[];
  // public dispatcher: FileTypeDispatcher;
  public filetypeMap: Map<string, string>;
  public handlerMap: Map<string, string>;

  private constructor() {
    this.canvasList = new Array();
    this.filetypeMap = new Map<string, string>();
    this.handlerMap = new Map<string, string>();

    asyncReadFile('src/core/fs/filetypes.json').then((res: string | void) => {
      if (res === undefined) throw new Error('Missing ./fs/filetypes.json file');
      this.filetypeMap = jsonToMap(res);
    });
    asyncReadFile('src/core/fs/handlers.json').then((res: string | void) => {
      if (res === undefined) throw new Error('Missing ./fs/handlers.json file');
      this.handlerMap = jsonToMap(res);
    });
    // this.dispatcher = new FileTypeDispatcher();
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
