import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import { Repository } from '../../core/vcs/Repository';

// import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as PATH from 'path';
import * as git from '../../core/vcs/git';
git.plugins.set('fs', fs);
import './fileexplorer.css';
import { SplitMode } from '../../core/lib/interaction';
// import * as path from 'path';
// import * as chokidar from 'chokidar';

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

  static fontlinkelement: HTMLLinkElement | undefined;

  primaryContainerElement: HTMLDivElement = document.createElement('div');
  mainItem: FileExplorerLazyPathItem;
  mainView: HTMLOListElement;

  /**
   * Default constructor for creating a FileExplorer card.
   * @param parent A canvas or stack instance that will contain the new FileExplorer card.
   * @param directory A valid directory path to associate content with this FileExplorer card.
   */
  constructor(parent: Canvas | Stack, directory: fs.PathLike | null) {
    super(parent, directory ? directory.toString() : process.cwd());
    if (! directory) {
      directory = fs.realpathSync(process.cwd());
    }
    this.mainItem = new FileExplorerLazyPathItem(
      directory,
      PATH.basename(directory.toString()),
      FileExplorerLazyPathItemMode.active
    );
    this.mainView = document.createElement('ol', { is: 'synectic-file-explorer-directory' });
    (this.mainView as FileExplorerDirView).setModel(this.mainItem);

    this.element.classList.add('fileexplorer');
    this.primaryContainerElement.setAttribute('id', (this.uuid + '-fileexplorer'));
    this.primaryContainerElement.setAttribute('class', 'fileexplorer-window nonselectable-interior');
    this.front.appendChild(this.primaryContainerElement);

    this.primaryContainerElement.appendChild(this.mainView);

    this.load();
  }

  /**
   * Read the directory structure and populate the element.
   */
  async load(): Promise<null> {
    console.log("Updating FileExplorer...");
    this.update().then(() => {
      console.log("Loaded:", this);

      if (global.Synectic && global.Synectic.GitManager) {
        console.debug("Trying to use", global.Synectic.GitManager);
        global.Synectic.GitManager.get(this.mainItem.path)
        .then((repo: Repository) => {
          repo.Ready.then(() => {
            this.mainItem.set_git_repo(repo);
            console.debug('FileExplorer using git repo:', repo);
            let gitpath = repo.path;
            console.debug('path type is', gitpath, typeof(gitpath));
            if (typeof(gitpath) === "string") {
              let git_head_file = PATH.join(gitpath, '.git', 'HEAD');
              console.debug('Trying to watch ', git_head_file);
              // chokidar.watch(
              //   git_head_file,
              //   {
              //     usePolling: true
              //   }
              // ).on('all', () => {
              //   console.debug('Git HEAD changed.');
              //   this.update();
              // });
            }
            setTimeout(() => {
              this.update();
            }, 500);
          });
        });
      }

    });
    return new Promise((resolve) => { resolve(); });
  }

  /**
   * Asynchronous update by Promise
   * @return void or error
   */
  async update(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mainItem.update().then(() => {
        try {
          (this.mainView as FileExplorerDirView).update()
          .then(() => {
            console.log("FileExplorer update complete:", this);
            resolve();
          });
        } catch (err) {
          console.error("Hmmm:", this);
          reject(err);
        }
      }).catch((err: any) => {
        reject(err);
      });
    });
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
    // this.editor.resize();
  }

  split(mode: SplitMode): void {
    super.split(mode);
    // this.editor.resize();
  }
}
