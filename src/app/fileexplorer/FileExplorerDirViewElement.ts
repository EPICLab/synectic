
import * as io from '../../core/fs/io';
import { handlerToCard } from '../../core/fs/io-handler';
import * as filetypes from '../../core/fs/filetypes';
import { Dialog } from '../../core/lib/Dialog';
// import * as chokidar from 'chokidar';
import * as PATH from 'path';
import * as git from '../../core/vcs/git';

import {
  filetype,
  FileExplorerLazyPathItem,
  FileExplorerLazyPathItemMode
} from './FileExplorerLazyPathItem';

export const mapIsoGitClasses: { [key: string]: string[] } = {
  "ignored": ["git-status-ignored"],
  "unmodified": ["git-status-tracked-clean"],
  "*modified": ["git-status-tracked-modified"],
  "*deleted": ["git-status-deleted"],
  "*added": ["git-status-untracked"],
  "absent": ["git-status-unknown"],
  "modified": ["git-status-tracked-modified"],
  "deleted": ["git-status-deleted"],
  "added": ["git-status-untracked"],
  "*unmodified": ["git-status-staging-conflict"],
  "*absent": ["git-status-staging-conflict"]
};

async function setElementGitStatusClasses(element: HTMLElement, newstatus: string | Promise<string>) {
  newstatus = await newstatus;
  Object.values(mapIsoGitClasses).forEach((val) => {
    val.map((classname) => {
      element.classList.remove(classname);
    });
  });
  element.classList.add(...(mapIsoGitClasses[newstatus]));
}

export class FileExplorerDirView extends HTMLOListElement {
  dirItem: FileExplorerLazyPathItem | undefined;
  feChildren: Map<string, FileExplorerDirView | HTMLElement> = new Map<string, FileExplorerDirView | HTMLElement>();
  mapFEvisualToModel:
    Map<HTMLElement | Element, FileExplorerLazyPathItem>
    = new Map<HTMLElement | Element, FileExplorerLazyPathItem>();
  feDropdownNameElement: HTMLElement;

  constructor() {
    super();
    this.classList.add("fileexplorer-dir-view");
    this.feDropdownNameElement = document.createElement('div');
    this.feDropdownNameElement.classList.add("fileexplorer-dir-header");
    this.feDropdownNameElement.innerText = "...";
    this.appendChild(this.feDropdownNameElement);
  }

  setModel(dirItem: FileExplorerLazyPathItem) {
    this.dirItem = dirItem;
    this.feDropdownNameElement.innerText = this.dirItem.name;

    // when we get clicked, it's active time!
    this.feDropdownNameElement.onclick = (event) => {
      console.debug(this, event);
      dirItem.toggle_active_state();
      dirItem.update()
      .then(() => {
        this.update()
        .catch((reason) => {
          console.error('FileExplorerDirView could not update visual model:', this, reason);
        });
      })
      .catch((reason) => {
        console.error('FileExplorerDirView.dirItem update failed in onclick:', this, reason);
      });
      event.stopPropagation();
    };

    this.dirItem.on('fe_add', (newLPI) => {
      this.add_item(newLPI);
    });
    this.dirItem.on('fe_remove', (oldLPI) => {
      this.remove_item(oldLPI);
    });
    this.dirItem.on('fe_update', (targetLPI) => {
      this.update_item(targetLPI);
    });

    this.dirItem.children.forEach((item, name/*, og_map*/) => {
      // first checking for items which we don't yet have rendered:
      const visualchild = this.feChildren.get(name);
      if (visualchild === undefined) {
        this.add_item(item);
      } else {
        if ((visualchild as FileExplorerDirView).update) {
          (visualchild as FileExplorerDirView).update()
          .catch((reason) => {
            console.error('FileExplorerDirView child update fail:', visualchild, reason);
          });
        }
      }
    });

    this.update()
    .catch((reason) => {
      console.error('FileExplorerDirView update failed:', this, reason);
    });
  }

  add_item (newLPI: FileExplorerLazyPathItem) {
    let visualchild: HTMLElement | HTMLOListElement | HTMLLIElement;
    if (newLPI.type === filetype.directory) {
      visualchild = document.createElement('ol', { is: 'synectic-file-explorer-directory' });
      (visualchild as FileExplorerDirView).setModel(newLPI);
      (visualchild as FileExplorerDirView).update()
      .catch((reason) => {
        console.error('FileExplorerDirView: update fail of', visualchild, reason);
      });
    } else {
      // it's a normal file
      visualchild = document.createElement('li');
      visualchild.classList.add('fileexplorer-file-item');
      visualchild.innerText = newLPI.name;

      // make it open that file when double-clicked
      // @ts-ignore
      visualchild.ondblclick = (e) => {
        filetypes.searchExt(io.extname(newLPI.path))
        .then(result => {
          if (result !== undefined) {
            handlerToCard(result.handler, newLPI.path.toString());
          }
        })
        .catch(error => new Dialog('snackbar', 'Open Card Dialog Error', error.message));
      };
    }

    this.feChildren.set(newLPI.name, visualchild);
    this.mapFEvisualToModel.set(visualchild, newLPI);

    // TODO sort
    // this.appendChild(visualchild);

    let targetchild;

    for (let i = 0; i < this.children.length; i++) {
      const lpi = this.mapFEvisualToModel.get(this.children[i]);
      if (! lpi) continue;
      if (
        lpi.name.toLowerCase().localeCompare(newLPI.name.toLowerCase()) > 0
      ) {
        targetchild = this.children[i];
        break;
      }
    }

    this.insertBefore(visualchild, targetchild ? targetchild : null);

    this.update_item(newLPI);
  }

  remove_item (oldLPI: FileExplorerLazyPathItem) {
    const visualchild = this.feChildren.get(oldLPI.name);
    if (!visualchild) return;
    console.debug('Deleting Visual Child:', visualchild);
    this.feChildren.delete(oldLPI.name);
    this.mapFEvisualToModel.delete(visualchild);
    this.removeChild(visualchild);
  }

  update_item (targetLPI: FileExplorerLazyPathItem) {
    const visualchild = this.feChildren.get(targetLPI.name);
    if (! visualchild) {
      throw Error('No such child: ' + targetLPI.name);
    }
    // update the git information on the child:
    if (
      targetLPI.gitrepo !== undefined &&
      targetLPI.gitrepo.path !== undefined
    ) {
      setElementGitStatusClasses(
        visualchild,
        git.status({
          "dir": targetLPI.gitrepo.path.toString(),
          "filepath": PATH.relative(targetLPI.gitrepo.path.toString(), targetLPI.path.toString())
        })
      )
      .catch((reason) => {
        console.error('Could not update git status for lpi:', targetLPI, reason);
      });
    }
  }

  /**
   * rebuild the visuals!
   */
  async update(): Promise<null> {
    if (this.dirItem === undefined) {
      return new Promise(resolve => resolve());
    }
    this.dirItem.update()
    .catch((reason) => {
      console.error('FileExplorerDirView update failed to update dirItem:', this.dirItem, reason);
    });
    if (this.dirItem.state === FileExplorerLazyPathItemMode.active) {
      this.classList.add("expanded");
      this.classList.remove("collapsed");
      this.mapFEvisualToModel.forEach((lpi, key) => {
        lpi.update().then(() => {
          if ((key as FileExplorerDirView).update) {
            (key as FileExplorerDirView).update()
            .catch((reason) => {
              console.error('Could not update', key, reason);
            });
          }
          this.update_item(lpi);
        })
        .catch((reason) => {
          console.error('FileExplorer LPI update fail:', lpi, reason);
        });
      });
    } else {
      this.classList.remove("expanded");
      this.classList.add("collapsed");
    }
    if (this.dirItem.gitrepo) {
      // b/c typescript thinks dirItem could be undef??
      const scopePassDirItem = this.dirItem;
      this.dirItem.gitrepo.current()
      .then((branchresult) => {
        this.feDropdownNameElement.innerHTML = scopePassDirItem.name + (
          branchresult ? (" [" + branchresult + "]") : ""
        );
      })
      .catch((reason) => {
        console.warn('Could not get a branch name from repo:', this.dirItem!.gitrepo, reason);
      });
    }
    return new Promise(resolve => resolve());
  }
}
