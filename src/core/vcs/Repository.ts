import * as git from '../../core/vcs/git';
import * as io from '../fs/io';
import * as path from 'path';
import { PathLike } from 'fs-extra';
import { Branch } from './Branch';
import { Dialog } from '../lib/Dialog';

export class Repository {

  repoName: string;
  private branchCache: Map<string, PathLike> = new Map(); // branch => cached repo root path
  Ready: Promise<void>;
  private rootPath: PathLike | undefined;
  get path () { return this.rootPath };
  private rootBranch: string | undefined;
  private cachePath: PathLike | undefined;

  constructor(repoName: string, origPath: PathLike) {
    this.repoName = repoName;
    this.Ready = this.initialize(origPath);
  }

  private initialize(origPath: PathLike): Promise<void> {
    if (this.rootPath && this.rootBranch && this.cachePath) {
      return new Promise(resolve => resolve());
    } else {
      return new Promise(async (resolve, reject) => {
        this.rootPath = await git.getRepoRoot(origPath);
        this.rootBranch = await git.getCurrentBranch(this.rootPath);
        this.cachePath = path.join(this.rootPath.toString(), '/.syn/');
        await this.reloadCache();
        if (this.rootPath && this.rootBranch && this.cachePath) resolve();
        else reject();
      });
    }
  }

  /**
   * Asynchronously formats and returns an array of local and remote branch names
   * contained within this repository. Retrieves new branches discovered by Git
   * through fetch or pull commands.
   */
  async branches(): Promise<{local: Set<string>, remote: Set<string>}> {
    await this.Ready;
    let local: Set<string> = new Set();
    let remote: Set<string> = new Set();
    if (this.rootPath) {
      local = new Set(await git.getLocalBranches(this.rootPath));
      const cache = new Set(Array.from(this.branchCache.keys()));
      local = new Set(function*() { yield* local; yield* cache; }());
      local.delete('HEAD');
      remote = new Set(await git.getRemoteBranches(this.rootPath));
      remote.delete('HEAD');
    }
    return { local: local, remote: remote };
  }

  /**
   * Asynchronously retrieves the name of the current branch from this repository
   */
  async current(): Promise<string | undefined> {
    await this.Ready;
    if (this.rootPath) {
      return git.getCurrentBranch(this.rootPath);
    }
    return new Promise((_, reject) => reject());
  }

  /**
   * Asynchronously reads git repository metadata and returns an array of remote definitions.
   * @param filepath Optional filename or path contained within a valid git repository; defaults to
   * repository root if blank.
   */
  async getRemotes(filepath?: PathLike): Promise<git.RemoteDefinition[]> {
    await this.Ready;
    const repoRoot = filepath ? await git.getRepoRoot(filepath) : this.rootPath;
    if (repoRoot) return git.getRemotes(repoRoot);
    else throw new Error(`Repository '${this.repoName}' misconfigured; unable to read '.git' root path.`);
  }

  /**
   * Asynchronously retrieve branch instance from this repository; cache is managed
   * seamlessly in the background to provide multiple branches simultaneously.
   * @param filepath A valid filename or path contained within a valid git repository.
   * @param branch Optional branch name for selecting branch to be returned; defaults to current branch if blank.
   */
  async getBranch(filepath: PathLike, branch?: string): Promise<Branch> {
    await this.Ready;
    const repoRoot = await git.getRepoRoot(filepath);
    const currentBranch = await git.getCurrentBranch(repoRoot);
    if (branch) return this.cacheRetrieve(branch);
    else if (currentBranch) return this.cacheRetrieve(currentBranch);
    else throw new Error(`Repository '${this.repoName}' misconfigured with no current branch.`);
  }

  /**
   * Instantiates directories, migrates .git directory from root path to cached path,
   * and checks out specific branch.
   * @param branch Name of branch to be checked out and cached from this repository.
   */
  private async cachingBranch(branch: string): Promise<Branch> {
    if (!this.rootPath || !this.rootBranch || !this.cachePath) {
      const errorMsg = `Repository '${this.repoName}' not configured; run 'Repository::Ready' first.`;
      new Dialog('banner', `Repository Error`, errorMsg);
      throw new Error(`Unable to execute because 'Repository::Ready' must be run first.`);
    }
    const branchCachePath = path.join(this.cachePath.toString(), branch, '/');
    await io.writeDirAsync(branchCachePath);
    await io.copyFiles(path.join(this.rootPath.toString(), '/.git'), path.join(branchCachePath, '/.git'));
    const remoteName = (await this.getRemotes(branchCachePath))[0].remote;
    await git.checkout({
      dir: branchCachePath,
      ref: branch,
      remote: remoteName
    });
    this.branchCache.set(branch, branchCachePath);
    return new Branch(this, branch, branchCachePath);
  }

  /**
   * Inspect cache directories and reload mapping of branch names to cached repo root paths.
   */
  private async reloadCache(): Promise<void> {
    if (!this.rootPath || !this.rootBranch || !this.cachePath) {
      const errorMsg = `Repository '${this.repoName}' not configured; run 'Repository::Ready' first.`;
      new Dialog('banner', `Repository Error`, errorMsg);
      throw new Error(`Unable to execute because 'Repository::Ready' must be run first.`);
    }
    const basePath = this.cachePath;
    io.exists(basePath)
      .then(async exist => {
        if (!exist) await io.writeDirAsync(basePath);
      })
      .catch(error => { throw new Error('reloadCache Error: ' + error); });
    const branchDirs = await io.readDirAsync(basePath, true);
    branchDirs.forEach(async branchDir => {
      const branchCachePath = path.join(basePath.toString(), '/', branchDir);
      io.exists(branchCachePath)
        .then(versioned => {
          if (versioned) this.branchCache.set(branchDir, branchCachePath);
        })
        .catch(error => { throw new Error('reloadCache Error: ' + error); });
    });
  }

  /**
   * Retrieve branch instance if available in cache, otherwise create new cached repository
   * for the requested branch.
   * @param branch Name of branch to be checked out and cached from this repository.
   */
  private async cacheRetrieve(branch: string): Promise<Branch> {
    if (!this.rootPath || !this.rootBranch || !this.cachePath) {
      const errorMsg = `Repository '${this.repoName}' not configured; run 'Repository::Ready' first.`;
      new Dialog('banner', `Repository Error`, errorMsg);
      throw new Error(`Unable to execute because 'Repository::Ready' must be run first.`);
    }
    const cached = this.branchCache.get(branch);
    if (cached) return new Branch(this, branch, cached);
    if (branch === this.rootBranch) {
      this.branchCache.set(branch, this.rootPath);
      return new Branch(this, branch, this.rootPath);
    }
    return this.cachingBranch(branch);
  }

}

//
//   // async clone(): Promise<void> {
//   //   await git.clone({
//   //     dir: this.root.toString(),
//   //     url: git.toHTTPS(this.parent.remoteDefinitions[0].url),
//   //     ref: this.branch,
//   //     singleBranch: true,
//   //     depth: 10
//   //   });
//   // }
