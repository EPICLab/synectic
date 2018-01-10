// import { Card } from './../app/Card';
import { Canvas } from './../app/Canvas';

class AppManager {
  private static _instance: AppManager;
  public canvasList: Canvas[];

  private constructor() {
    this.canvasList = new Array();
  }

  public static get Instance(): AppManager {
    return this._instance || (this._instance = new this());
  }

  public newCanvas(): void {
    this.canvasList.push(new Canvas());
  }

  public last(): Canvas {
    return this.canvasList[this.canvasList.length - 1];
  }

  public print(): void {
    // let a = new Card();
    // let b = new Card(a);
    let c = new Canvas();
    //
    // console.log('Card a');
    // console.log('uuid: ' + a.uuid);
    // if (a.parent) console.log('parent: ' + a.parent.uuid);
    // else console.log('parent: ' + a.parent);
    // console.log('\nCard b');
    // console.log('uuid: ' + b.uuid);
    // if (b.parent) console.log('parent: ' + b.parent.uuid);
    // else console.log('parent: ' + b.parent);
    // console.log('\nCanvas');
    // console.log('uuid: ' + c.uuid);
    console.log('Canvas uuid: ' + c.uuid);
  }
}

export const AppManagerInstance = AppManager.Instance;
