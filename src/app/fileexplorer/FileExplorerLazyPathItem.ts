import * as io from '../../core/fs/io';
import { Repository } from '../../core/vcs/Repository';

//import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as PATH from 'path';

export const enum FileExplorerLazyPathItemMode {
  active,
  lazy
}

export const enum filetype {
  directory,
  file
}

/**
 * a FileExplorerLazyPathItem for representing stuff only when needed.
 *
 * active -> will rescan and watch children
 * lazy -> does not rescan unless asked to or becomes active
 */
export class FileExplorerLazyPathItem {
  path: fs.PathLike;
  name: string;
  state: FileExplorerLazyPathItemMode;
  children: Map<string, FileExplorerLazyPathItem> = new Map<string, FileExplorerLazyPathItem>();
  type: filetype;
  stats: fs.Stats;
  gitrepo: Repository | undefined;

  constructor(
    path: fs.PathLike,
    name: string,
    state: FileExplorerLazyPathItemMode,
    gitrepo?: Repository | undefined
  ) {
    this.path = path;
    this.name = name;
    this.state = state;
    this.gitrepo = gitrepo;
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

  async set_git_repo(repo: Repository) {
    this.gitrepo = repo;
    // @ts-ignore
    this.children.forEach((value, key, map) => {
      value.set_git_repo(repo);
    });
    return this.update();
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
          var dirItems = io.safeReadDirSync(this.path);
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
                FileExplorerLazyPathItemMode.lazy,
                this.gitrepo
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
