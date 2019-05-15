import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';

//import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as PATH from 'path';
import * as git from 'isomorphic-git';
git.plugins.set('fs', fs);
import './fileexplorer.css';
import { SplitMode } from '../../core/lib/interaction';
//import * as path from 'path';

// taking some ideas from https://github.com/mihneadb/node-directory-tree/blob/master/lib/directory-tree.js

const enum filetype {
  directory,
  file
}

function safeReadDirSync(path: fs.PathLike): string[] | null {
  let dirData: string[];
  try {
    dirData = fs.readdirSync(path);
  } catch (ex) {
    if (ex.code == "EACCES") {
      //User does not have permissions, ignore directory
      return null;
    }
    else throw ex;
  }
  return dirData;
}

const enum ExplorerLazyLoadItemMode {
  active,
  lazy
}
/**
 * a ExplorerLazyLoadItem for representing stuff only when needed.
 *
 * active -> will rescan and watch children
 * lazy -> does not rescan unless asked to or becomes active
 */
class ExplorerLazyLoadItem {
  path: fs.PathLike;
  name: string;
  state: ExplorerLazyLoadItemMode;
  children: Map<string, ExplorerLazyLoadItem> = new Map<string, ExplorerLazyLoadItem>();
  type: filetype | undefined;
  stats: fs.Stats;

  constructor(
    path: fs.PathLike,
    name: string,
    state: ExplorerLazyLoadItemMode
  ) {
    this.path = path;
    this.name = name;
    this.state = state;
    this.stats = fs.statSync(path);
    this.update().then((result) => {
      console.debug("ExplorerLazyLoadItem constructor update done:", result);
    }).catch((err) => {
      console.error("ExplorerLazyLoadItem:", err);
    });
  }

  /**
   * re-stats itself, explores directory if active
   * @return [description]
   */
  async update(): Promise<null> {
    return new Promise((resolve, reject) => {
      try {
        this.stats = fs.statSync(this.path.toString());
      }
      catch (err) {
        reject(err);
      }
      if (
        this.state === ExplorerLazyLoadItemMode.active &&
        this.stats.isDirectory()
      ) {
        // rescan for new children
        try {
          var dirItems = safeReadDirSync(this.path);
          if (dirItems == null) {
            reject({"safeReadDirSync gave": dirItems});
            return;
          };
          var child_promises = dirItems.map((dirItem) => {
            var child = this.children.get(dirItem);
            if (child == undefined) {
              var newchild = new ExplorerLazyLoadItem(
                PATH.join(this.path.toString(), dirItem),
                dirItem,
                ExplorerLazyLoadItemMode.lazy
              );
              this.children.set(
                dirItem,
                newchild
              );
              return newchild.update()
            }
            else {
              return child.update();
            }
          });
          // now we wait for the child Items to update:
          Promise.all(child_promises).then((values) => {
          console.debug("Resolved children:", values);
            resolve();
          }).catch((error) => {
            reject({"child item gave:": error});
          });
        }
        catch (err) {
          reject(err);
        }
      }
      else {
        resolve();
      }
    });
  }
}

export class FileExplorer extends Card {

  primaryContainerElement: HTMLDivElement = document.createElement('div');
  mainItem: ExplorerLazyLoadItem;

  /**
   * Default constructor for creating a FileExplorer card.
   * @param parent A canvas or stack instance that will contain the new FileExplorer card.
   * @param directory A valid directory path to associate content with this FileExplorer card.
   * @param gitrevision A commit ID that if specified will browse files at that commit,
   *                    causes editor cards spawned to reference read-only file from commit
   */
  constructor(parent: Canvas | Stack, directory: fs.PathLike | null) {
    super(parent, directory? directory.toString() : process.cwd() );
    if (directory === null || directory === undefined) {
      directory = fs.realpathSync(process.cwd());
    }
    this.mainItem = new ExplorerLazyLoadItem(
      directory,
      PATH.basename(directory.toString()),
      ExplorerLazyLoadItemMode.active
    );

    this.element.classList.add('fileexplorer');
    this.primaryContainerElement.setAttribute('id', (this.uuid + '-fileexplorer'));
    this.primaryContainerElement.setAttribute('class', 'fileexplorer-window');
    this.front.appendChild(this.primaryContainerElement);

    this.load();

  }

  /**
   * Read the directory structure and populate the element.
   */
  load(): void {
    console.log("Updating FileExplorer...");
    this.update().then(() => {
      console.log("Now:", this.mainItem);
    });
  }

  /**
   * Asynchronous update by Promise
   * @return void or error
   */
  async update(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mainItem.update().then(() => {
        // TODO update the visual elements now
        //
        resolve();
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
    //this.editor.resize();
  }

  split(mode: SplitMode): void {
    super.split(mode);
    //this.editor.resize();
  }
}
