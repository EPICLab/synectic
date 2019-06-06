import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import { Repository } from '../../core/vcs/Repository';

//import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as PATH from 'path';
import * as git from '../../core/vcs/git';
git.plugins.set('fs', fs);
import './fileexplorer.css';
import { SplitMode } from '../../core/lib/interaction';
//import * as path from 'path';

import {
  FileExplorerLazyPathItem,
  FileExplorerLazyPathItemMode
} from './FileExplorerLazyPathItem';

import {
  FileExplorerDirView
} from './FileExplorerDirViewElement';

window.customElements.define(
  "synectic-file-explorer-directory",
  FileExplorerDirView,
  {
    extends: 'ol'
  }
);

export class FileExplorer extends Card {

  primaryContainerElement: HTMLDivElement = document.createElement('div');
  mainItem: FileExplorerLazyPathItem;
  mainView: HTMLOListElement;

  /**
   * Default constructor for creating a FileExplorer card.
   * @param parent A canvas or stack instance that will contain the new FileExplorer card.
   * @param directory A valid directory path to associate content with this FileExplorer card.
   */
  constructor(parent: Canvas | Stack, directory: fs.PathLike | null) {
    super(parent, directory? directory.toString() : process.cwd() );
    if (directory === null || directory === undefined) {
      directory = fs.realpathSync(process.cwd());
    }
    this.mainItem = new FileExplorerLazyPathItem(
      directory,
      PATH.basename(directory.toString()),
      FileExplorerLazyPathItemMode.active
    );
    this.mainView = document.createElement('ol', {is: 'synectic-file-explorer-directory'});
    (this.mainView as FileExplorerDirView).setModel(this.mainItem);

    this.element.classList.add('fileexplorer');
    this.primaryContainerElement.setAttribute('id', (this.uuid + '-fileexplorer'));
    this.primaryContainerElement.setAttribute('class', 'fileexplorer-window nonselectable-interior');
    this.front.appendChild(this.primaryContainerElement);

    this.primaryContainerElement.appendChild(this.mainView);

    if (global.Synectic && global.Synectic.GitManager) {
      console.debug("Trying to use", global.Synectic.GitManager);
      global.Synectic.GitManager.get(this.mainItem.path)
      .then((repo: Repository) => {
        this.mainItem.set_git_repo(repo)
        .then(() => {
          (this.mainView as FileExplorerDirView).update();
        });
      });
    }

    this.load();
  }

  /**
   * Read the directory structure and populate the element.
   */
  load(): void {
    console.log("Updating FileExplorer...");
    this.update().then(() => {
      console.log("Loaded:", this);
    });
  }

  /**
   * Asynchronous update by Promise
   * @return void or error
   */
  async update(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mainItem.update().then(() => {
        try {
          (this.mainView as FileExplorerDirView).update();
          resolve();
        }
        catch (err) {
          console.error("Hmmm:", this);
          throw err;
        }
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  /**
   * synchronous rebuild of the visual elements
   *
   * no I/O should be done here
   */
  refresh_view(): void {

  }

  /**
   * FileExplorer doesn't have any changes to save.
   * @return Boolean
   */
  hasUnsavedChanges(): boolean {
    return false;
  }

  /**
   * FileExplorer has nothing to save.
   */
  save(): void {
    return;
  }

  resize(): void {
    super.resize();
    //this.editor.resize();
  }

  split(mode: SplitMode): void {
    super.split(mode);
    //this.editor.resize();
  }
}
