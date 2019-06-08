
import * as io from '../../core/fs/io';
import { handlerToCard } from '../../core/fs/io-handler';
import * as filetypes from '../../core/fs/filetypes';
import { Dialog } from '../../core/lib/Dialog';

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
      console.debug(this, event);
      dirItem.toggle_active_state();
      dirItem.update().then(() => {
        this.update();
      });
      event.stopPropagation();
    }

    this.update();
  }

  /**
   * rebuild the visuals!
   */
  async update(): Promise<null> {
    if (this.dirItem === undefined) {
      return new Promise(resolve => resolve());
    }
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

          // make it open that file when double-clicked
          // @ts-ignore
          visual_child.ondblclick = (e) => {
            filetypes.searchExt(io.extname(item.path))
            .then(result => {
              if (result !== undefined) {
                handlerToCard(result.handler, item.path.toString());
              }
            })
            .catch(error => new Dialog('snackbar', 'Open Card Dialog Error', error.message));
          };
        }
      }
      else {
        if ((visual_child as FileExplorerDirView).update) {
          (visual_child as FileExplorerDirView).update();
        }
      }
      // update the git information on the children:
      // @ts-ignore
      if (
        this.dirItem!.gitrepo !== undefined &&
        this.dirItem!.gitrepo.path !== undefined
      ) {
        setElementGitStatusClasses(
          visual_child,
          git.status({
            "dir": this.dirItem!.gitrepo.path.toString(),
            "filepath": PATH.relative(this.dirItem!.gitrepo.path.toString(), item.path.toString())
          })
        );
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
