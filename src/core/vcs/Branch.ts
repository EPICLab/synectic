// import * as git from '../../core/vcs/git';
import { PathLike } from 'fs-extra';
import { Repository } from './Repository';
// import { addClass, removeClass } from "../lib/helper";
// import * as io from "../fs/io";
// import * as path from 'path';
// import { Dropdown } from '../lib/Dropdown';
// import { Card } from '../lib/Card';

export class Branch {

  repository: Repository;
  branch: string;
  root: PathLike;

  constructor(repository: Repository, branch: string, root: PathLike) {
    this.repository = repository;
    this.branch = branch;
    this.root = root;
  }

}


/**
 * Representation a git branch for an individual card instance.
 */
// export class Branch {
//
//   // target: Card;
//   repo: Repository;
//   branch: string; // branch name
//   root: PathLike; // root directory for this branch
//   // branchMenu: DropMenu = new DropMenu([], 'branchMenu');
//   fetchButton: HTMLButtonElement = document.createElement('button');
//   pullButton: HTMLButtonElement = document.createElement('button');
//   pushButton: HTMLButtonElement = document.createElement('button');
//
//   /**
//    * Default constructor for creating a branch.
//    * @param repo A repository instance that manages all branches in a given git repository.
//    * @param branch A valid branch name (local or remote-only).
//    */
//   constructor(repo: Repository, branch: string, root: PathLike) {
//     // this.target = target;
//     this.repo = repo;
//     this.branch = branch;
//     this.root = root;
//
//     this.fetchButton.setAttribute('class', 'fetch');
//     this.fetchButton.setAttribute('title', 'Git Fetch');
//     this.pullButton.setAttribute('class', 'pull');
//     this.pullButton.setAttribute('title', 'Git Pull');
//     this.pushButton.setAttribute('class', 'push');
//     this.pushButton.setAttribute('title', 'Git Push');
//     this.refreshMenu();
//   }
//
//   destructor() {
//     if (this.branchMenu.menu.parentNode) {
//       this.branchMenu.menu.parentNode.removeChild(this.branchMenu.menu);
//     }
//     if (this.fetchButton.parentNode) {
//       this.fetchButton.parentNode.removeChild(this.fetchButton);
//     }
//     if (this.pullButton.parentNode) {
//       this.pullButton.parentNode.removeChild(this.pullButton);
//     }
//     if (this.pushButton.parentNode) {
//       this.pushButton.parentNode.removeChild(this.pushButton);
//     }
//   }
//
//   refreshMenu() {
//     console.log(`----[refreshMenu within Branch: ${this.branch}]----`);
//     this.branchMenu.options.forEach(opt => this.branchMenu.remove(opt));
//
//     this.repo.branches.remote.forEach(remote => {
//       if (this.repo.branches.local.has(remote)) {
//         this.insertMenuOption(remote); // local and remote branch
//       } else {
//         this.insertMenuOption(remote, true); // remote-only branch
//       }
//     });
//
//     this.repo.branches.local.forEach(local => {
//       if (!this.branchMenu.options.has(local)) {
//         this.insertMenuOption(local); // local-only branch
//       }
//     });
//
//     this.branchMenu.selected(this.branch);
//   }
//
//   private insertMenuOption(id: string, remoteOnly: boolean = false) {
//     const branchButton = document.createElement('button');
//     branchButton.innerText = branchButton.id = id;
//     if (remoteOnly) this.addRemoteIcon(branchButton);
//     branchButton.onclick = () => {
//       console.log(`switch to branch: '${id}'`);
//       this.target.branchChange(id);
//     };
//     this.branchMenu.add(branchButton);
//   }
//
//   private addRemoteIcon(option: HTMLButtonElement) {
//     const remoteIcon = document.createElement('img');
//     remoteIcon.setAttribute('class', 'remote');
//     remoteIcon.setAttribute('src', '../src/asset/remote_dark.svg');
//     option.appendChild(remoteIcon);
//   }
//
//   // get branchMenu(): HTMLDivElement {
//   //   const branchMenu = new DropMenu([], 'branches');
//   //   this.parent.localBranches.forEach((_, branch) => {
//   //     const branchButton = document.createElement('button');
//   //     branchButton.id = branch;
//   //     branchButton.innerText = branch;
//   //     branchMenu.addOption(branchButton);
//   //     branchButton.onclick = () => {
//   //       // const exists = await io.exists(this.root);
//   //       // if (!exists) await io.writeDirAsync(this.root);
//   //       console.log(`switch to branch: '${branch}'`);
//   //       const existingBranch = this.parent.localBranches.get(branch);
//   //       if (existingBranch) {
//   //         existingBranch
//   //       }
//   //     };
//   //   });
//   //   this.branchMenus.push(branchMenu);
//   //   return branchMenu.menu;
//   // }
//   //
//   // get fetchButton(): HTMLButtonElement {
//   //   const fetchButton = document.createElement('button');
//   //   fetchButton.setAttribute('class', 'fetch');
//   //   fetchButton.setAttribute('title', 'Git Fetch');
//   //   if (!this.parent.remoteBranches.has(this.branch)) {
//   //     addClass(fetchButton, 'disabled');
//   //   }
//   //   fetchButton.onclick = async () => await this.fetch();
//   //   this.fetchButtons.push(fetchButton);
//   //   return fetchButton;
//   // }
//   //
//   // get pullButton(): HTMLButtonElement {
//   //   const pullButton = document.createElement('button');
//   //   pullButton.setAttribute('class', 'pull');
//   //   pullButton.setAttribute('title', 'Git Pull');
//   //   if (!this.parent.remoteBranches.has(this.branch)) {
//   //     addClass(pullButton, 'disabled');
//   //   }
//   //   pullButton.onclick = async () => await this.pull();
//   //   this.pullButtons.push(pullButton);
//   //   return pullButton;
//   // }
//   //
//   // get pushButton(): HTMLButtonElement {
//   //   const pushButton = document.createElement('button');
//   //   pushButton.setAttribute('class', 'push');
//   //   pushButton.setAttribute('title', 'Git Push');
//   //   pushButton.onclick = async () => await this.push();
//   //   this.pushButtons.push(pushButton);
//   //   return pushButton;
//   // }
//
//   // refresh(): void {
//   //   if (this.parent.remoteBranches.has(this.branch)) {
//   //     this.fetchButtons.forEach(fetchButton => removeClass(fetchButton, 'disabled'));
//   //     this.pullButtons.forEach(pullButton => removeClass(pullButton, 'disabled'));
//   //   } else {
//   //     this.fetchButtons.forEach(fetchButton => addClass(fetchButton, 'disabled'));
//   //     this.pullButtons.forEach(pullButton => addClass(pullButton, 'disabled'));
//   //   }
//   //   console.log(`refreshed [${this.parent.repo}-${this.branch}]`);
//   // }
//
//   async checkout(): Promise<void> {
//     return await git.checkout({
//       dir: this.root.toString(),
//       ref: this.branch,
//       remote: (await this.repo.getRemotes(this.root))[0].remote
//     });
//   }
//
//   async fetch(): Promise<git.FetchResponse> {
//     return await git.fetch({
//       dir: this.root.toString(),
//       url: git.toHTTPS((await this.repo.getRemotes(this.root))[0].url),
//       ref: this.branch,
//       depth: 1,
//       singleBranch: true,
//       tags: false
//     });
//   }
//
//   async pull(): Promise<void> {
//     await git.pull({
//       dir: this.root.toString(),
//       ref: this.branch,
//       singleBranch: true
//     });
//   }
//
//   async push(): Promise<git.PushResponse> {
//     return await git.push({
//       dir: this.root.toString(),
//       remote: (await this.repo.getRemotes(this.root))[0].remote ,
//       ref: this.branch,
//       token: process.env.GITHUB_TOKEN
//     });
//   }
//
//
//
//
//   // checkout(target: Card, newBranch?: string) {
//   //   const targetBranch = newBranch ? this.parent.localBranches.get(newBranch) : this;
//   //   if (targetBranch) {
//   //     const targetRoot = path.join(this.root.toString() + '/.syn/' + targetBranch.branch);
//   //     console.log(`writing directory: ${targetRoot}`);
//   //     writeDirAsync(targetRoot)
//   //       .then(async () => {
//   //         await git.clone({
//   //           dir: targetRoot,
//   //           url: git.toHTTPS(this.parent.remoteDefinitions[0].url),
//   //           ref: targetBranch.branch,
//   //           singleBranch: true,
//   //           depth: 10
//   //         });
//   //         const fetchButton = this.fetchButtons.get(target);
//   //         const pullButton = this.pullButtons.get(target);
//   //         const pushButton = this.pushButtons.get(target);
//   //         if (fetchButton) {
//   //           const parent = fetchButton.parentNode;
//   //           if (parent) {
//   //             parent.insertBefore(this.fetch, fetchButton);
//   //             parent.removeChild(fetchButton);
//   //           }
//   //         }
//   //         if (pullButton) {
//   //           const parent = pullButton.parentNode;
//   //           if (parent) {
//   //             parent.insertBefore(this.fetch, pullButton);
//   //             parent.removeChild(pullButton);
//   //           }
//   //         }
//   //         if (pushButton) {
//   //           const parent = pushButton.parentNode;
//   //           if (parent) {
//   //             parent.insertBefore(this.fetch, pushButton);
//   //             parent.removeChild(pushButton);
//   //           }
//   //         }
//   //       })
//   //       .catch(error => {
//   //         new Dialog('banner', `'${this.branch}' Branch Error`, `Unable to checkout branch '${targetBranch.branch}'. Error: ${error}`);
//   //       });
//   //   }
//   //   return targetBranch;
//   // }
//   //
//   // get menu(): HTMLDivElement {
//   //   const branchMenu = new DropMenu([], 'branches');
//   //   this.parent.localBranches.forEach((_, branchName) => {
//   //     const branchButton = document.createElement('button');
//   //     branchButton.id = branchName;
//   //     branchButton.innerText = branchName;
//   //     branchMenu.addOption(branchButton);
//   //     branchButton.onclick = () => {
//   //       console.log(`switch to branch: '${branchName}'`);
//   //       this.checkout(branchName);
//   //     };
//   //   });
//   //   this.branchMenus.push(branchMenu);
//   //   return branchMenu.menu;
//   // }
//   //
//   // get fetch(): HTMLButtonElement {
//   //   const fetchButton = document.createElement('button');
//   //   fetchButton.setAttribute('class', 'fetch');
//   //   fetchButton.setAttribute('title', 'Git Fetch');
//   //   if (!this.parent.remoteBranches.has(this.branch)) {
//   //     addClass(fetchButton, 'disabled');
//   //   }
//   //   this.fetchButtons.push(fetchButton);
//   //   return fetchButton;
//   // }
//   //
//   // get pull(): HTMLButtonElement {
//   //   const pullButton = document.createElement('button');
//   //   pullButton.setAttribute('class', 'pull');
//   //   pullButton.setAttribute('title', 'Git Pull');
//   //   if (!this.parent.remoteBranches.has(this.branch)) {
//   //     addClass(pullButton, 'disabled');
//   //   }
//   //   this.pullButtons.push(pullButton);
//   //   return pullButton;
//   // }
//   //
//   // get push(): HTMLButtonElement {
//   //   const pushButton = document.createElement('button');
//   //   pushButton.setAttribute('class', 'push');
//   //   pushButton.setAttribute('title', 'Git Push');
//   //   this.pushButtons.push(pushButton);
//   //   return pushButton;
//   // }
// }
