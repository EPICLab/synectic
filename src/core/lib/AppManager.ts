import { Canvas } from './Canvas';
import { EventDispatcher } from '../events/events';
import { CredentialManager } from '../vcs/CredentialManager';
import * as git from 'isomorphic-git';
import fs from 'fs';
git.plugins.set('fs', fs);

class AppManager {

  private static _instance: AppManager;
  public canvasList: Canvas[];
  public credentialManager: CredentialManager;
  public events: EventDispatcher;

  private constructor() {
    this.canvasList = new Array();
    this.events = new EventDispatcher();
    this.credentialManager = new CredentialManager();
    git.plugins.set('credentialManager', this.credentialManager);
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
