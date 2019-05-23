import { Repository } from "./Repository";
import { Dropdown } from "../lib/Dropdown";
import { BranchState, Branch } from "./Branch";
import { addClass, removeClass } from "../lib/helper";

/**
 * Manages the displayed state and availability of UI elements for a given branch; however, the
 * selected branch and associated state can vary within the configured repository.
 */
export class BranchUI {

  repository: Repository;
  private branch: Branch;
  private menu: Dropdown;
  private fetchButton: HTMLButtonElement = document.createElement('button');
  private pullButton: HTMLButtonElement = document.createElement('button');
  private pushButton: HTMLButtonElement = document.createElement('button');

  constructor(repository: Repository, branch: Branch) {
    this.repository = repository;
    this.branch = branch;
    this.menu = new Dropdown(this.repository.repoName);
    addClass(this.fetchButton, 'fetch');
    this.fetchButton.setAttribute('title', 'Git Fetch');
    addClass(this.pullButton, 'pull');
    this.pushButton.setAttribute('title', 'Git Pull');
    addClass(this.pushButton, 'push');
    this.pushButton.setAttribute('title', 'Git Push');

    document.addEventListener(`fetch-${this.repository.repoName}`, async () => {
      console.log(`fetch event: fetch-${this.repository.repoName}`);
      await this.refreshMenu();
    });
    document.addEventListener(`pull-${this.repository.repoName}`, async () => {
      console.log(`pull event: pull-${this.repository.repoName}`);
      await this.refreshMenu();
    });
  }

  getBranch(): Branch {
    return this.branch;
  }

  async setBranch(branch: Branch) {
    this.branch = branch;
    await this.refreshButtons();
  }

  async getRepoButtons(): Promise<{ fetch: HTMLButtonElement, pull: HTMLButtonElement, push: HTMLButtonElement }> {
    await this.refreshButtons();
    return { fetch: this.fetchButton, pull: this.pullButton, push: this.pushButton };
  }

  async refreshButtons(): Promise<void> {
    const branches = await this.repository.branches();
    if (this.branch.branch && !branches.remote.has(this.branch.branch)) {
      addClass(this.fetchButton, 'disabled');
      addClass(this.pullButton, 'disabled');
    }
    if (this.branch.branch && branches.remote.has(this.branch.branch)) {
      removeClass(this.fetchButton, 'disabled');
      removeClass(this.pullButton, 'disabled');
    }
  }

  async getMenu(): Promise<Dropdown> {
    await this.refreshMenu();
    return this.menu;
  }

  async refreshMenu(): Promise<void> {
    const branches = await this.repository.branches();
    branches.remote.forEach(remote => {
      if (!this.menu.options.has(remote)) this.addOption(remote, BranchState.BOTH);
      if (branches.local.has(remote)) {
        this.updateOption(remote, BranchState.BOTH);
      } else {
        this.updateOption(remote, BranchState.REMOTE);
      }
    });
    branches.local.forEach(local => {
      if (!this.menu.options.has(local)) this.addOption(local, BranchState.BOTH);
      if (branches.remote.has(local)) {
        this.updateOption(local, BranchState.BOTH);
      } else {
        this.updateOption(local, BranchState.LOCAL);
      }
    });
    this.menu.options.forEach(option => {
      if (!branches.remote.has(option.id) && !branches.local.has(option.id)) {
        this.removeOption(option.id);
      }
    });
    const current = await this.repository.current();
    if (current) this.menu.selected(current);
  }

  private addOption(branch: string, state: BranchState) {
    const branchButton = document.createElement('button');
    branchButton.innerText = branch;
    branchButton.id = branch;
    if (state === BranchState.REMOTE) {
      const remoteIcon = document.createElement('img');
      remoteIcon.setAttribute('class', 'remote');
      remoteIcon.setAttribute('src', '../src/asset/remote_dark.svg');
      branchButton.appendChild(remoteIcon);
    }
    this.menu.add(branchButton);
    branchButton.addEventListener('click', async () => {
      const checkoutEvent = new Event(`checkout-${this.repository.repoName}`);
      document.dispatchEvent(checkoutEvent);
    });
    return branchButton;
  }

  removeOption(branch: string) {
    this.removeOption(branch);
  }

  updateOption(branch: string, state: BranchState) {
    const option = this.menu.options.get(branch);
    if (!option) return;

    switch (state) {
    case BranchState.LOCAL: {
      const remoteIcons = Array.from(option.getElementsByClassName('remote'));
      remoteIcons.forEach(remoteIcon => remoteIcon.remove());
      break;
    }
    case BranchState.REMOTE: {
      const remoteIcon = document.createElement('img');
      remoteIcon.setAttribute('class', 'remote');
      remoteIcon.setAttribute('src', '../src/asset/remote_dark.svg');
      const remoteIcons = Array.from(option.getElementsByClassName('remote'));
      remoteIcons.forEach(remoteIcon => remoteIcon.remove());
      option.appendChild(remoteIcon);
      break;
    }
    case BranchState.BOTH: {
      const remoteIcons = Array.from(option.getElementsByClassName('remote'));
      remoteIcons.forEach(remoteIcon => remoteIcon.remove());
      break;
    }
    }
  }

}
