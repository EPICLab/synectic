import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import isHash from 'validator/lib/isHash';

import type { GitStatus, Repository, SHA1, UUID } from '../types';
import * as io from './io';
import * as git from './git';

// API SOURCE: https://git-scm.com/docs/git-worktree

export type Worktree = {
  id: UUID; // The UUID for Worktree object.
  path: fs.PathLike; // The relative or absolute path to the git worktree root repository.
  bare: boolean; // A flag for indicating a bare git worktree.
  detached: boolean; // A flag for indicating a detached HEAD state in the worktree.
  main: boolean; // A flag for indicating a main worktree, as opposed to a linked worktree.
  ref?: string; // A branch name or symbolic ref (can be abbreviated).
  rev?: SHA1 | string; // A revision (or commit) representing the current state of `index` for the worktree.
}
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]; // see: https://stackoverflow.com/questions/48230773/how-to-create-a-partial-like-that-requires-a-single-property-to-be-set/48244432#48244432
type WorktreePaths = {
  dir: fs.PathLike;
  gitdir: fs.PathLike;
}

/**
 * Utility function for compiling all necessary information for working with either linked and main working trees 
 * (see [git-worktree](https://git-scm.com/docs/git-worktree)).
 * @param dir The working tre directory path.
 * @param gitdir The git directory path (typicallyg ends in `.git`).
 * @param bare A flag indicating a bare git worktree.
 * @return A Worktree object 
 */
const createWorktree = async (dir: fs.PathLike, gitdir = path.join(dir.toString(), '.git'), bare = false): Promise<Worktree> => {
  const branch = await git.currentBranch({ dir: dir.toString(), gitdir: gitdir });
  const commit = await git.resolveRef({ dir: dir, ref: 'HEAD' });
  const isMain = await isLinkedWorktree({ dir: dir });
  return {
    id: v4(),
    path: path.resolve(dir.toString()),
    bare: bare,
    detached: branch ? false : true,
    main: isMain,
    ref: branch ? branch : undefined,
    rev: commit
  };
}

/**
 * Utility function for discerning whether a working tree directory path (`dir`) or a git directory path (`gitdir`) is associated with a 
 * linked working tree (see [git-worktree](https://git-scm.com/docs/git-worktree)). This is determined by examining whether `.git` points
 * to a sub-directory or a file; where a sub-directory indicates a main worktree and a file indicates a linked worktree.
 * @param dir The working tree directory path.
 * @param gitdir The git directory path (typically ends in `.git`).
 * @return A boolean indicating whether the provided path is a linked worktree.
 */
export const isLinkedWorktree = async (param: AtLeastOne<WorktreePaths>)
  : Promise<boolean> => {
  const gitdir = param.gitdir
    ? param.gitdir
    : (param.dir ? path.join(param.dir.toString(), '.git') : undefined);
  return gitdir ? !(await io.isDirectory(gitdir)) : false;
}

/**
 * Resolve the root working tree directory from a linked worktree. Starting from the *.git* file within a linked worktree, reads the path
 * to the worktree folder in the main worktree (i.e. `.git/worktrees/worktree-branch`) and walks upward until it finds a directory 
 * containing a *.git* subdirectory.
 * @param filepath The relative or absolute path within a working tree to evaluate.
 * @return A Promise object containing the working tree directory path, or undefined if the working tree *.git* file or the main tree
 * *.git* directory do not exist.
 */
export const resolveWorktreeRoot = async (filepath: fs.PathLike): Promise<string | undefined> => {
  const worktreeRoot = await git.getRepoRoot(filepath);
  if (!worktreeRoot) return undefined; // no root Git directory indicates that the filepath is not part of a Git repo
  if (!isLinkedWorktree({ dir: worktreeRoot })) return undefined; // not part of a linked worktree, use `git.getStatus` instead

  const gitdir = (await io.readFileAsync(`${worktreeRoot}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
  const dir = await git.getRepoRoot(gitdir); // need to find the working tree directory containing .git in the main worktree
  return dir;
}

export const status = async (filepath: fs.PathLike): Promise<GitStatus | undefined> => {
  const worktreeRoot = await git.getRepoRoot(filepath);
  if (!worktreeRoot) return undefined; // no root Git directory indicates that the filepath is not part of a Git repo
  if (!isLinkedWorktree({ dir: worktreeRoot })) return undefined; // not part of a linked worktree, use `git.getStatus` instead

  const dir = await resolveWorktreeRoot(filepath);
  if (!dir) return undefined;
  const branch = await git.currentBranch({ dir: worktreeRoot });
  if (!branch) return undefined;

  // determine SHA-1 hash for content in the git index
  const fileOid = await git.resolveOid(filepath, branch);
  if (!fileOid) return undefined;
  const oid = (await isogit.readBlob({ fs: fs, dir: dir, oid: fileOid })).oid;

  // determine SHA-1 hash for content in the file
  const fileContent = await io.readFileAsync(filepath, { encoding: 'utf-8' });
  const hash = await isogit.hashBlob({ object: fileContent });

  let status: GitStatus = 'unmodified';
  if (oid !== hash.oid) status = 'modified';
  if (oid === undefined) status = 'added';
  if (hash === undefined) status = 'deleted';

  // const branchRef = await git.resolveRef({ dir: dir, ref: `heads/${branch}` });
  // const check = await isogit.walk({
  //   fs: fs,
  //   dir: dir,
  //   trees: [isogit.TREE({ ref: branchRef })],
  //   map: async (filename: string, entries: Array<isogit.WalkerEntry> | null) => {
  //     if (filename === '.' || filename !== relative(worktreeRoot, filepath.toString())) {
  //       console.log(`skip: ${filename}`);
  //       return;
  //     }
  //     console.log(`evaluate: ${filename}`);
  //     if (!entries) {
  //       console.log('no entries!');
  //       return;
  //     }
  //     const [entry] = entries.slice(0, 1);
  //     if ((await entry.type()) === 'tree') return;

  //     const oid = await entry.oid();
  //     const fileContent = await io.readFileAsync(filepath, { encoding: 'utf-8' });
  //     const hash = await isogit.hashBlob({ object: fileContent });

  //     console.log({ oid, hash });

  //     let result = 'unmodified';
  //     if (oid !== hash.oid) result = 'modified';
  //     if (oid === undefined) result = 'added';
  //     if (hash === undefined) result = 'removed';

  //     return result;
  //   }
  // });
  // console.log({ status, check });
  return status;
}

/**
 * Get worktree path information for a branch within a repository. The main worktree is always listed, even when no linked
 * worktrees exist, so the base case is that the main worktree information is returned. If there is no worktree associated
 * with the target branch, a new worktree will be added (including checking out the code into a separate `.syn/{branch}` 
 * directory outside of the root directory of the main worktree) and returned.
 * @param repo The Repository object that points to the main worktree.
 * @param targetBranch The local or remote target branch that should be resolved into a worktree.
 * @return A Worktree object containing a path to linked/main worktree root, a ref to current branch, and the current commit
 * revision hash at the head of the branch.
 */
export const resolveWorktree = async (repo: Repository, targetBranch: string): Promise<Worktree | undefined> => {
  if (![...repo.local, ...repo.remote].includes(targetBranch)) return undefined; // unknown target branch
  const worktrees = await list(repo.root);
  const existing = worktrees ? worktrees.find(w => w.ref === targetBranch) : undefined;
  if (existing) return existing;
  const linkedRoot = path.normalize(`${repo.root.toString()}/../.syn/${targetBranch}`);
  await add(repo, linkedRoot, targetBranch);
  const updatedWorktrees = await list(repo.root);
  return updatedWorktrees ? updatedWorktrees.find(w => w.ref === targetBranch) : undefined;
}

/**
 * Create a new directory and checkout a branch (either creating a new branch or switching to an existing branch) into the
 * new directory. The new working directory is linked to the current repository, sharing everything except working directory
 * specific files such as `HEAD`, `index`, etc. Adheres to the specifications of the `git worktree add` command, see:
 * https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-addltpathgtltcommit-ishgt
 * @param repo A Repository object that points to the main worktree.
 * @param dir The relative or absolute path to create the new linked worktree; will create a new directory if none is found.
 * @param commitish A branch name or symbolic ref.
 * @return A Promise object for the add worktree operation.
 */
export const add = async (repo: Repository, dir: fs.PathLike, commitish?: string): Promise<void> => {
  const commit = commitish ? (isHash(commitish, 'sha1') ? commitish : await git.resolveRef({ dir: repo.root, ref: commitish }))
    : await git.resolveRef({ dir: repo.root, ref: 'HEAD' });
  const branch = (commitish && !isHash(commitish, 'sha1')) ? commitish : io.extractDirname(dir);
  const gitdir = path.resolve(`${dir.toString()}/.git`);
  const worktreedir = path.join(repo.root.toString(), '/.git/worktrees', branch);
  const commondir = path.relative(worktreedir, path.join(repo.root.toString(), '.git'));
  const detached = (commitish && isHash(commitish, 'sha1')) ? commitish : undefined;

  // initialize the linked worktree
  await git.clone({ repo: repo, dir: dir, ref: branch });

  // populate internal git files in main worktree to recognize the new linked worktree
  await fs.ensureDir(worktreedir);
  await fs.copy(path.resolve(`${dir}/.git/HEAD`), path.join(worktreedir, 'HEAD'));
  detached ? await io.writeFileAsync(path.join(worktreedir, 'HEAD'), detached + '\n')
    : await fs.copy(path.resolve(`${dir}/.git/index`), `${worktreedir}/index`);
  await io.writeFileAsync(path.resolve(`${worktreedir}/${commondir}/refs/heads/${branch}`), commit + '\n');
  await io.writeFileAsync(path.join(worktreedir, 'ORIG_HEAD'), commit + '\n');
  await io.writeFileAsync(path.join(worktreedir, 'commondir'), commondir + '\n');
  await io.writeFileAsync(path.join(worktreedir, 'gitdir'), gitdir + '\n');

  // // overwrite the internal git files in linked worktree to point to main worktree
  await fs.remove(gitdir);
  await io.writeFileAsync(gitdir, `gitdir: ${worktreedir}\n`);
  return;
}

/**
 * List details of each working tree. Resulting array contains the main working tree as the first element, followed by each of the linked 
 * working trees found in `GIT_DIR/worktrees`. The output details include whether the working tree is bare, the revision currently checked 
 * out, the branch currently checked out (or "detached HEAD" if none), and "locked" if the worktree is locked.
 * @param dir The relative or absolute path to a working tree directory.
 * @return A Promise containing an array of worktree details, or undefined if not under version control.
 */
export const list = async (dir: fs.PathLike): Promise<Worktree[] | undefined> => {
  if (!(await io.extractStats(dir))) return; // cannot list from non-existent git directory
  let root = await git.getRepoRoot(dir);
  if (!root) return undefined; // if there is no root, then dir is not under version control

  if (await isLinkedWorktree({ dir: root })) {
    // dir points to a linked worktree, so we update root to point to the main worktree path
    const worktreedir = (await io.readFileAsync(`${root}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
    const commondir = (await io.readFileAsync(`${worktreedir}/commondir`, { encoding: 'utf-8' })).trim();
    root = path.normalize(`${worktreedir}/${commondir}/..`);
  }

  const main = await createWorktree(root);
  const worktrees = path.join(root, '.git/worktrees');
  // .git/worktrees directory will only exist if a linked worktree has been added (even if it was later deleted), so verify it exists
  const exists = (await io.extractStats(worktrees)) ? true : false;
  const linked = exists ? await Promise.all((await io.readDirAsync(worktrees)).map(async worktree => {
    const gitdir = (await io.readFileAsync(`${root}/.git/worktrees/${worktree}/gitdir`, { encoding: 'utf-8' })).trim();
    const dir = path.normalize(`${gitdir}/..`);
    return await createWorktree(dir);
  })) : [];

  /**
   * LIST OUTPUT FORMAT
   *   The worktree list command has two output formats. The default format
   *   shows the details on a single line with columns. For example:
   * 
   *       S git worktree list
   *       /path/to/bare-source            (bare)
   *       /path/to/linked-worktree        abcd1234 [master]
   *       /path/to/other-linked-worktree  1234abc  (detached HEAD)
   *
   * SOURCE: https://docs.oracle.com/cd/E88353_01/html/E37839/git-worktree-1.html
   */

  return [main, ...linked];
}


export const lock = (worktree: Worktree, reason?: string): void => {
  // TODO: Implementation will be added in future versions.
  console.log({ worktree, reason });
  return;
}

export const move = (worktree: Worktree, newPath: fs.PathLike): void => {
  // TODO: Implementation will be added in future versions.
  console.log({ worktree, newPath });
  return;
}

/**
 * Prune working tree information in `$GIT_DIR/worktrees`, specifically worktrees that were deleted without using `worktreeRemove` 
 * (or the underlying `git worktree remove` terminal command). The `expire` option further restricts which worktrees will be removed
 * based on a specific datetime threshold.
 * @param dir The relative or absolute directory path for the main worktree.
 * @param verbose Flag for reporting all removals.
 * @param expire Only expire unusued working trees older than a specific DateTime.
 * @param dryRun Flag for not removing anything; just reporting what would be removed.
 * @return A Promise for the prune worktree command.
 */
export const prune = async (dir: fs.PathLike, verbose = false, expire?: DateTime, dryRun = false): Promise<void> => {
  if (!(await io.extractStats(dir))) return; // cannot prune non-existent git directory
  const worktrees = await list(dir);
  if (!worktrees) return; // if worktrees is undefined, then dir is not under version control

  const mainWorktree = worktrees?.shift(); // remove first worktree from list, since the main worktree cannot be pruned
  if (!mainWorktree) return; // if there is no linked worktrees, then pruning is a no-op

  worktrees.map(async worktree => {
    const stats = await io.extractStats(worktree.path);
    if (!stats || (expire && stats && DateTime.fromJSDate(stats.mtime) < expire)) {
      const worktreedir = path.resolve(path.join(mainWorktree.path.toString(), '.git/worktrees', worktree.ref ? worktree.ref : 'ERROR'));
      if (verbose) console.log(`Removing worktrees/${worktree.ref}: gitdir file points to non-existent location`);
      if (!dryRun) fs.remove(worktreedir);
    }
  });
}

/**
 * Remove a linked working tree, when is in a clean state (no untracked files and no modifications in tracked files). Unclean working 
 * trees or ones with submodules can be removed by enabling the `force` option. When enabled, `force` will also delete the branch associated
 * with the linked worktree.
 * @param worktree A Worktree object containing details of the linked worktree to be removed.
 * @param force Flag for deleting the linked worktree (and branch) even if the currently in a dirty worktree state.
 * @return A Promise for the removing worktree command.
 */
export const remove = async (worktree: Worktree, force = false): Promise<void> => {
  const gitdir = path.join(worktree.path.toString(), '.git');
  if (!(await io.extractStats(gitdir))) return; // cannot remove non-existent git directory
  if (!(await isLinkedWorktree({ gitdir: gitdir }))) return; // main worktree cannot be removed
  const status = await git.getStatus(worktree.path.toString());
  if (status === 'modified' && !force) return; // cannot remove non-clean working trees (untracked files and modifications in tracked files)

  const worktreedir = (await io.readFileAsync(gitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
  const root = await git.getRepoRoot(worktreedir);

  await fs.remove(worktreedir); // remove the .git/worktrees/{branch} directory in the main worktree  
  await fs.remove(worktree.path.toString()); // remove the directory of the linked worktree
  if (force && root && worktree.ref) await git.deleteBranch({ dir: root, ref: worktree.ref }); // delete branch ref, if force param is enabled

  return;
}

export const repair = (path: fs.PathLike, ...paths: fs.PathLike[]): void => {
  // TODO: Implementation will be added in future versions.
  console.log({ path, paths });
  return;
}

export const unlock = (worktree: Worktree): void => {
  // TODO: Implementation will be added in future versions.
  console.log({ worktree });
  return;
}