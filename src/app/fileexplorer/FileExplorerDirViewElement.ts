
import * as io from '../../core/fs/io';
import { handlerToCard } from '../../core/fs/io-handler';
import * as filetypes from '../../core/fs/filetypes';
import { Dialog } from '../../core/lib/Dialog';
import * as chokidar from 'chokidar';
import * as PATH from 'path';
import * as git from '../../core/vcs/git';

import {
  filetype,
  FileExplorerLazyPathItem,
  FileExplorerLazyPathItemMode
} from './FileExplorerLazyPathItem';


export var isogit_to_classes_map: { [key:string]:string[] } = {
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
  "*absent": ["git-status-staging-conflict"],
}

async function setElementGitStatusClasses(element: HTMLElement, newstatus: string | Promise<string>) {
  newstatus = await newstatus;
  Object.values(isogit_to_classes_map).forEach((val) => {
    val.map((classname) => {
      element.classList.remove(classname);
    });
  });
  element.classList.add(...(isogit_to_classes_map[newstatus]));
}

export class FileExplorerDirView extends HTMLOListElement {
  dirItem: FileExplorerLazyPathItem | undefined;
  fe_children: Map<string, FileExplorerDirView | HTMLElement> = new Map<string, FileExplorerDirView | HTMLElement>();
  fe_visual_to_model: Map<HTMLElement | Element, FileExplorerLazyPathItem> = new Map<HTMLElement | Element, FileExplorerLazyPathItem>();
  fe_dropdown_name: HTMLElement;
  watcher: chokidar.FSWatcher | undefined;

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
      console.debug(this, event);
      dirItem.toggle_active_state();
      dirItem.update().then(() => {
        this.update();
      });
      event.stopPropagation();
    }

    this.dirItem.on('fe_add', (new_lpi) => {
      this.add_item(new_lpi);
    });
    this.dirItem.on('fe_remove', (old_lpi) => {
      this.remove_item(old_lpi);
    });
    this.dirItem.on('fe_update', (target_lpi) => {
      this.update_item(target_lpi);
    });

    this.dirItem.children.forEach((item, name/*, og_map*/) => {
      // first checking for items which we don't yet have rendered:
      var visual_child = this.fe_children.get(name);
      if (visual_child === undefined) {
        this.add_item(item);
      }
      else {
        if ((visual_child as FileExplorerDirView).update) {
          (visual_child as FileExplorerDirView).update();
        }
      }
    });

    this.update();
  }

  add_item (new_lpi: FileExplorerLazyPathItem) {
    var visual_child: HTMLElement | HTMLOListElement | HTMLLIElement;
    if (new_lpi.type == filetype.directory) {
      visual_child = document.createElement('ol', {is: 'synectic-file-explorer-directory'});
      (visual_child as FileExplorerDirView).setModel(new_lpi);
      (visual_child as FileExplorerDirView).update();
    }
    else {
      // it's a normal file
      visual_child = document.createElement('li');
      visual_child.classList.add('fileexplorer-file-item');
      visual_child.innerText = new_lpi.name;

      // make it open that file when double-clicked
      // @ts-ignore
      visual_child.ondblclick = (e) => {
        filetypes.searchExt(io.extname(new_lpi.path))
        .then(result => {
          if (result !== undefined) {
            handlerToCard(result.handler, new_lpi.path.toString());
          }
        })
        .catch(error => new Dialog('snackbar', 'Open Card Dialog Error', error.message));
      };
    }

    this.fe_children.set(new_lpi.name, visual_child);
    this.fe_visual_to_model.set(visual_child, new_lpi);

    // TODO sort
    // this.appendChild(visual_child);

    var target_child;

    for (let i = 0; i < this.children.length; i++) {
      var lpi = this.fe_visual_to_model.get(this.children[i]);
      if (! lpi) continue;
      if (
        lpi.name.toLowerCase().localeCompare(new_lpi.name.toLowerCase()) > 0
      ) {
        target_child = this.children[i];
        break;
      }
    }

    this.insertBefore(visual_child, target_child? target_child : null);

    this.update_item(new_lpi);
  }

  remove_item (old_lpi: FileExplorerLazyPathItem) {
    var visual_child = this.fe_children.get(old_lpi.name);
    console.debug('Deleting Visual Child:', visual_child);
    this.fe_children.delete(old_lpi.name);
    this.removeChild(visual_child!);
  }

  update_item (target_lpi: FileExplorerLazyPathItem) {
    var visual_child = this.fe_children.get(target_lpi.name);
    if (visual_child == undefined) {
      throw 'No such child: ' + target_lpi.name;
    }
    // update the git information on the child:
    if (
      target_lpi.gitrepo !== undefined &&
      target_lpi.gitrepo.path !== undefined
    ) {
      setElementGitStatusClasses(
        visual_child!,
        git.status({
          "dir": target_lpi.gitrepo.path.toString(),
          "filepath": PATH.relative(target_lpi.gitrepo.path.toString(), target_lpi.path.toString())
        })
      );
    }
  }

  /**
   * rebuild the visuals!
   */
  async update(): Promise<null> {
    if (this.dirItem === undefined) {
      return new Promise(resolve => resolve());
    }
    if (this.dirItem.state === FileExplorerLazyPathItemMode.active) {
      this.classList.add("expanded");
      this.classList.remove("collapsed");
    }
    else {
      this.classList.remove("expanded");
      this.classList.add("collapsed");
    }
    if (this.dirItem.gitrepo) {
      // b/c typescript thinks dirItem could be undef??
      var scope_pass_dirItem = this.dirItem;
      this.dirItem.gitrepo.current().then((branchresult) => {
        this.fe_dropdown_name.innerHTML = scope_pass_dirItem.name + (
          branchresult? (" [" + branchresult + "]") : ""
        );
      });
    }
    return new Promise(resolve => resolve());
  }
}
