import * as git from '../../core/vcs/git';
import { PathLike } from 'fs-extra';
import { Repository } from './Repository';

export enum BranchState { LOCAL = 'local', REMOTE = 'remote', BOTH = 'both' }

export class Branch {

  repository: Repository;
  branch: string;
  root: PathLike;

  constructor(repository: Repository, branch: string, root: PathLike) {
    this.repository = repository;
    this.branch = branch;
    this.root = root;
  }

  async fetch(): Promise<git.FetchResponse | undefined> {
    const branches = await this.repository.branches();
    if (branches.remote.has(this.branch)) {
      const remotes = await this.repository.getRemotes(this.root);
      const fetchResponse = await git.fetch({
        dir: this.root.toString(),
        url: git.toHTTPS(remotes[0].url),
        ref: this.branch,
        singleBranch: true,
        tags: false
      });
      const fetchEvent = new Event(`fetch-${this.repository.repoName}`);
      document.dispatchEvent(fetchEvent);
      return fetchResponse;
    }
  }

  async pull(): Promise<void> {
    await git.pull({
      dir: this.root.toString(),
      ref: this.branch,
      singleBranch: true
    });
    const pullEvent = new Event(`pull-${this.repository.repoName}`);
    document.dispatchEvent(pullEvent);
  }

  async push(): Promise<git.PushResponse | undefined> {
    const branches = await this.repository.branches();
    if (branches.remote.has(this.branch)) {
      const remotes = await this.repository.getRemotes(this.root);
      const pushResponse = await git.push({
        dir: this.root.toString(),
        remote: remotes[0].remote,
        ref: this.branch,
        token: process.env.GITHUB_TOKEN
      });
      const pushEvent = new Event(`push-${this.repository.repoName}`);
      document.dispatchEvent(pushEvent);
      return pushResponse;
    }
  }
}
