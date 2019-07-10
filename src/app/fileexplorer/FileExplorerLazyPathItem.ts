// import * as io from '../../core/fs/io';
import { Repository } from '../../core/vcs/Repository';

// import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as PATH from 'path';
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';

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
export class FileExplorerLazyPathItem extends EventEmitter {
  path: fs.PathLike;
  name: string;
  state: FileExplorerLazyPathItemMode;
  children: Map<string, FileExplorerLazyPathItem> = new Map<string, FileExplorerLazyPathItem>();
  type: filetype;
  stats: fs.Stats;
  gitrepo: Repository | undefined;
  watcher: chokidar.FSWatcher | undefined;

  constructor(
    path: fs.PathLike,
    name: string,
    state: FileExplorerLazyPathItemMode,
    gitrepo?: Repository | undefined
  ) {
    super();
    this.path = path;
    this.name = name;
    this.state = state;
    this.gitrepo = gitrepo;
    this.stats = fs.statSync(path);
    this.stats.isDirectory() ? this.type = filetype.directory : this.type = filetype.file;
    this.update().then((result) => {
      console.debug("FileExplorerLazyPathItem constructor update done:", result);
    }).catch((err) => {
      console.error("FileExplorerLazyPathItem:", err);
    });

    if (this.state === FileExplorerLazyPathItemMode.active) {
      this.start_watcher();
    }
  }

  start_watcher() {
    // start watcher:
    this.watcher = chokidar.watch(this.path.toString(), {
      disableGlobbing: true,
      depth: 0
    }).on('all', (eventname, path) => {
      if (eventname === 'add' || eventname === 'addDir') {
        if (path === this.path.toString()) return;
        // new file added:
        let newchild = new FileExplorerLazyPathItem(
          path,
          PATH.basename(path),
          FileExplorerLazyPathItemMode.lazy,
          this.gitrepo
        );
        this.children.set(path, newchild);
        this.emit('fe_add', newchild);
      } else if (eventname === 'unlink' || eventname === 'unlinkDir') {
        if (this.children.has(path)) {
          let deleted_child = this.children.get(path);
          this.children.delete(path);
          this.emit('fe_remove', deleted_child);
        }
      } else { // any other change
        let target_child = this.children.get(path);
        this.emit('fe_update', target_child);
      }
    });
  }

  toggle_active_state() {
    if (this.state === FileExplorerLazyPathItemMode.active) {
      this.watcher!.unwatch(this.path.toString());
      this.state = FileExplorerLazyPathItemMode.lazy;
    } else {
      if (! this.watcher) {
        this.start_watcher();
      } else {
        this.watcher.add(this.path.toString());
      }
      this.state = FileExplorerLazyPathItemMode.active;
    }
  }

  set_git_repo(repo: Repository) {
    this.gitrepo = repo;
    // @ts-ignore
    this.children.forEach((value, key, map) => {
      return value.set_git_repo(repo);
    });
  }

  /**
   * re-stats itself, explores directory if active
   * @return [description]
   */
  async update(): Promise<null> {
    return new Promise((resolve, reject) => {
      resolve();
      reject();
      // try {
      //   this.stats = fs.statSync(this.path.toString());
      // }
      // catch (err) {
      //   reject(err);
      // }
      // if (
      //   this.state === FileExplorerLazyPathItemMode.active &&
      //   this.stats.isDirectory()
      // ) {
      //   // rescan for new children
      //   try {
      //     var dirItems = io.safeReadDirSync(this.path);
      //     if (dirItems == null) {
      //       reject({"safeReadDirSync gave": dirItems});
      //       return;
      //     };
      //     var child_promises = dirItems.map((dirItem) => {
      //       var child = this.children.get(dirItem);
      //       if (child == undefined) {
      //         var newchild = new FileExplorerLazyPathItem(
      //           PATH.join(this.path.toString(), dirItem),
      //           dirItem,
      //           FileExplorerLazyPathItemMode.lazy,
      //           this.gitrepo
      //         );
      //         this.children.set(
      //           dirItem,
      //           newchild
      //         );
      //         return newchild.update()
      //       }
      //       else {
      //         return child.update();
      //       }
      //     });
      //     // now we wait for the child Items to update:
      //     Promise.all(child_promises).then((values) => {
      //     console.debug("Resolved children:", values);
      //       resolve();
      //     }).catch((error) => {
      //       reject({"child item gave:": error});
      //     });
      //   }
      //   catch (err) {
      //     reject(err);
      //   }
      // }
      // else {
      //   resolve();
      // }
    });

  }

  destroy () {
    this.watcher!.close();
    this.removeAllListeners();
  }
}
