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

const enum FileExplorerLazyPathItemMode {
  active,
  lazy
}
/**
 * a FileExplorerLazyPathItem for representing stuff only when needed.
 *
 * active -> will rescan and watch children
 * lazy -> does not rescan unless asked to or becomes active
 */
class FileExplorerLazyPathItem {
  path: fs.PathLike;
  name: string;
  state: FileExplorerLazyPathItemMode;
  children: Map<string, FileExplorerLazyPathItem> = new Map<string, FileExplorerLazyPathItem>();
  type: filetype;
  stats: fs.Stats;

  constructor(
    path: fs.PathLike,
    name: string,
    state: FileExplorerLazyPathItemMode
  ) {
    this.path = path;
    this.name = name;
    this.state = state;
    this.stats = fs.statSync(path);
    this.stats.isDirectory()? this.type = filetype.directory : this.type = filetype.file;
    this.update().then((result) => {
      console.debug("FileExplorerLazyPathItem constructor update done:", result);
    }).catch((err) => {
      console.error("FileExplorerLazyPathItem:", err);
    });
  }

  toggle_active_state() {
    if (this.state == FileExplorerLazyPathItemMode.active) {
      this.state = FileExplorerLazyPathItemMode.lazy;
    }
    else {
      this.state = FileExplorerLazyPathItemMode.active;
    }
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
        this.state === FileExplorerLazyPathItemMode.active &&
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
              var newchild = new FileExplorerLazyPathItem(
                PATH.join(this.path.toString(), dirItem),
                dirItem,
                FileExplorerLazyPathItemMode.lazy
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

class FileExplorerDirView extends HTMLOListElement {
  dirItem: FileExplorerLazyPathItem | undefined;
  fe_children: Map<string, FileExplorerDirView | HTMLElement> = new Map<string, FileExplorerDirView | HTMLElement>();
  fe_dropdown_name: HTMLElement;

  constructor() {
    super();
    this.classList.add("fileexplorer-dir-view");
    this.fe_dropdown_name = document.createElement('div');
    this.fe_dropdown_name.classList.add("fileexplorer-dir-header");
    this.fe_dropdown_name.innerText = "...";
    this.appendChild(this.fe_dropdown_name);
  }

  setModel(dirItem: FileExplorerLazyPathItem) {
    this.dirItem = dirItem;
    this.fe_dropdown_name.innerText = this.dirItem.name;

    // when we get clicked, it's active time!
    this.fe_dropdown_name.onclick = (event) => {
      console.log(this, event);
      dirItem.toggle_active_state();
      dirItem.update().then(() => {
        this.update();
      });
      event.stopPropagation();
    }
  }

  /**
   * rebuild the visuals!
   */
  update(): void {
    if (this.dirItem == undefined) return;
    // @ts-ignore
    this.dirItem.children.forEach((item, name, og_map) => {
      // first checking for items which we don't yet have rendered:
      var visual_child = this.fe_children.get(name);
      if (visual_child === undefined) {
        if (item.type == filetype.directory) {
          visual_child = document.createElement('ol', {is: 'synectic-file-explorer-directory'});
          (visual_child as FileExplorerDirView).setModel(item);
          (visual_child as FileExplorerDirView).update();
          this.fe_children.set(name, visual_child);
          this.appendChild(visual_child);
        }
        else {
          // it's a normal file
          visual_child = document.createElement('li');
          visual_child.classList.add('fileexplorer-file-item');
          visual_child.innerText = item.name;
          this.fe_children.set(name, visual_child);
          this.appendChild(visual_child);
        }
      }
      else {
        if ((visual_child as FileExplorerDirView).update) {
          (visual_child as FileExplorerDirView).update();
        }
      }
    });
    if (this.dirItem.state === FileExplorerLazyPathItemMode.active) {
      this.classList.add("expanded");
      this.classList.remove("collapsed");
    }
    else {
      this.classList.remove("expanded");
      this.classList.add("collapsed");
    }
  }
}

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
