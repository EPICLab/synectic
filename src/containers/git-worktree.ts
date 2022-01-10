import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import isHash from 'validator/lib/isHash';

import type { GitStatus, Repository, SHA1, UUID } from '../types';
import { AtLeastOne, removeUndefinedProperties } from './format';
import * as io from './io';
import { checkout, clone, currentBranch, deleteBranch, getRepoRoot, getStatus } from './git-porcelain';
import { getIgnore, resolveOid, resolveRef } from './git-plumbing';
import { parse } from './git-index';
import { compareStats } from './io-stats';

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
type WorktreePaths = {
  dir: fs.PathLike;
  gitdir: fs.PathLike;
}

/**
 * Utility function for compiling all necessary information for working with either linked or main working trees 
 * (see [git-worktree](https://git-scm.com/docs/git-worktree)).
 * @param dir The working tre directory path.
 * @param gitdir The git directory path (typicallyg ends in `.git`).
 * @param bare A flag indicating a bare git worktree.
 * @return A Worktree object 
 */
const createWorktree = async (dir: fs.PathLike, gitdir = path.join(dir.toString(), '.git'), bare = false): Promise<Worktree> => {
  const branch = await currentBranch({ dir: dir.toString(), gitdir: gitdir });
  const commit = await resolveRef({ dir: dir, ref: 'HEAD' });
  const isMain = await isLinkedWorktree({ dir: dir });
  const ref = removeUndefinedProperties({ ref: branch ? branch : undefined });
  return {
    id: v4(),
    path: path.resolve(dir.toString()),
    bare: bare,
    detached: branch ? false : true,
    main: isMain,
    rev: commit,
    ...ref,
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
export const isLinkedWorktree = async (param: AtLeastOne<WorktreePaths>): Promise<boolean> => {
  const gitdir = param.gitdir
    ? param.gitdir
    : (param.dir ? path.join(param.dir.toString(), '.git') : undefined);
  return gitdir ? !(await io.isDirectory(gitdir)) : false;
}

/**
 * Resolve the root working tree directory from a linked worktree. Starting from the *.git* file within a linked worktree, reads the path
 * to the worktree folder in the main worktree (i.e. `.git/worktrees/worktree-branch`) and walks upward until it finds a directory 
 * containing a *.git* subdirectory.
 * @param worktreeRoot The working tree directory path for a linked worktree (i.e. the directory containing a *.git* file).
 * @return A Promise object containing the working tree directory path, or undefined if the working tree *.git* file or the main tree
 * *.git* directory do not exist.
 */
export const resolveLinkToRoot = async (worktreeRoot: fs.PathLike): Promise<string | undefined> => {
  if (!isLinkedWorktree({ dir: worktreeRoot })) return undefined; // not part of a linked worktree, use `git.getStatus` instead
  const gitdir = (await io.readFileAsync(`${worktreeRoot.toString()}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
  const dir = await getRepoRoot(gitdir); // need to find the working tree directory containing .git in the main worktree
  return dir;
}

/**
 * Efficiently get the status of multiple files in a linked worktree directory at once. This function is modeled after 
 * **isomorphic-git/statusMatrix**, even returning the same structure, but is capable of parsing paths in a linked worktree directory.
 * @param filepath Limits the query to the given directory and any contained files and directories.
 * @returns A Promise object containing an array of entries comprised of filenames and HEAD/WORKDIR/STAGE status digits, or undefined
 * if the given directory path is not under git version control.
 */
export const statusMatrix = async (filepath: fs.PathLike): Promise<[string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3][] | undefined> => {
  const worktreeRoot = await getRepoRoot(filepath);
  // check to see if under version control (i.e. git root path exists), and whether the root is a linked worktree root directory
  if (!worktreeRoot || !(await isLinkedWorktree({ dir: worktreeRoot }))) return undefined;
  const dir = await resolveLinkToRoot(worktreeRoot);
  if (!dir) return undefined; // not part of a linked worktree, use `git.getStatus` instead

  const branch = await currentBranch({ dir: worktreeRoot });
  if (!branch) return undefined;

  const ignoreWorktree = await getIgnore(worktreeRoot);
  // this rule is standard for git-based projects
  ignoreWorktree.add('.git');
  // .gitignore files often include 'node_modules/' as a rule, but node-ignore treats that rule as requiring the trailing '/'
  // so the 'node_module' directory will not be ignored. See: https://github.com/kaelzhang/node-ignore#2-filenames-and-dirnames
  ignoreWorktree.add('node_modules');

  // parse the appropriate git index file for evaluating staged tree status
  const gitdir = (await io.readFileAsync(`${worktreeRoot.toString()}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
  const indexBuffer = await io.readFileAsync(path.join(gitdir.toString(), 'index'));
  const index = parse(indexBuffer);

  const result = await isogit.walk({
    fs: fs,
    dir: worktreeRoot,
    gitdir: gitdir,
    trees: [isogit.TREE({ ref: branch }), isogit.WORKDIR(), isogit.STAGE()],
    map: async (filename: string, entries: (isogit.WalkerEntry | null)[]) => {
      if (!entries || filename === '.' || ignoreWorktree.ignores(filename)) return;

      const [workdir, stage] = entries.slice(1, 3);

      // determine oid for head tree
      const head = await resolveOid(path.join(worktreeRoot, filename), branch);

      // determine oid for working directory tree
      let workdirOid;
      if (!head && workdir && !stage) {
        workdirOid = '42';
      } else if (workdir) {
        const content = await io.readFileAsync(path.join(worktreeRoot, filename), { encoding: 'utf-8' });
        const hash = (await isogit.hashBlob({ object: content }));
        workdirOid = hash.oid;
      }

      // determine oid for index tree (staged)
      const indexEntry = index.entries.find(entry => entry.filePath === filename);
      const stageOid = indexEntry ? indexEntry.objectId.slice(2) : undefined;

      const entry = [undefined, head, workdirOid, stageOid];
      const result = entry.map(value => entry.indexOf(value));
      result.shift();

      return [filename, ...result];
    }
  });

  console.log(`worktree.statusMatrix => filepath: ${filepath.toString()}, branch: ${branch}, dir: ${worktreeRoot}, gitdir: ${gitdir}, result:`, { result });

  return new Promise(resolve => resolve(result));
}

/**
 * Determine whether a file has been changed in accordance with the git repository. This function is modeled after 
 * **isomorphic-git/status**, even returning the same structure, but is capable of parsing paths in a linked worktree directory.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing undefined if the path is not contained within a git repository, or a status indicator
 * for whether the path has been changed according to git; the possible resolve values are described for the `GitStatus` type definition.
 */
export const status = async (filepath: fs.PathLike): Promise<GitStatus | undefined> => {
  const worktreeRoot = await getRepoRoot(filepath);
  if (!worktreeRoot) return undefined; // no root Git directory indicates that the filepath is not part of a Git repo
  const dir = await resolveLinkToRoot(worktreeRoot);
  if (!dir) return undefined; // not part of a linked worktree, use `git.getStatus` instead

  const relativePath = path.relative(worktreeRoot, filepath.toString());
  const branch = await currentBranch({ dir: worktreeRoot });
  if (!branch) return undefined;

  const ignoreWorktree = await getIgnore(worktreeRoot);
  // this rule is standard for git-based projects
  ignoreWorktree.add('.git');
  // .gitignore files often include 'node_modules/' as a rule, but node-ignore treats that rule as requiring the trailing '/'
  // so the 'node_module' directory will not be ignored. See: https://github.com/kaelzhang/node-ignore#2-filenames-and-dirnames
  ignoreWorktree.add('node_modules');
  if (ignoreWorktree.ignores(relativePath)) return 'ignored';

  // determine oid for HEAD tree
  const oid = await resolveOid(filepath, branch);
  if (!oid) return undefined;
  const treeOid = (await isogit.readBlob({ fs: fs, dir: dir, oid: oid })).oid;

  // parse the appropriate git index file for evaluating staged tree status
  const gitdir = (await io.readFileAsync(`${worktreeRoot.toString()}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
  const indexBuffer = await io.readFileAsync(path.join(gitdir.toString(), 'index'))
  const index = parse(indexBuffer);
  const indexEntry = index.entries.find(entry => entry.filePath === relativePath);

  const stats = await io.extractStats(filepath);
  const indexOid = indexEntry ? indexEntry.objectId.slice(2) : undefined;

  const H = treeOid !== null;     // head
  const I = indexEntry !== null;  // index
  const W = stats !== null;       // working dir

  const getWorkdirOid = async () => {
    if (indexEntry && stats && !compareStats(indexEntry, stats)) {
      return indexEntry.objectId;
    } else {
      const object = await io.readFileAsync(filepath, { encoding: 'utf-8' });
      const workdirOid = (await isogit.hashBlob({ object: object })).oid;
      return workdirOid;
    }
  }

  if (!H && !W && !I) return 'absent';
  if (!H && !W && I) return '*absent';
  if (!H && W && !I) return '*added';
  if (!H && W && I) {
    const workdirOid = await getWorkdirOid();
    return workdirOid === indexOid ? 'added' : '*added';
  }
  if (H && !W && !I) return 'deleted';
  if (H && !W && I) return '*deleted';
  if (H && W && !I) {
    const workdirOid = await getWorkdirOid();
    return workdirOid === treeOid ? '*undeleted' : '*undeletemodified';
  }
  if (H && W && I) {
    const workdirOid = await getWorkdirOid();
    if (workdirOid === treeOid) {
      return workdirOid === indexOid ? 'unmodified' : '*unmodified';
    } else {
      return workdirOid === indexOid ? 'modified' : '*modified';
    }
  }
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
  const commit = commitish ? (isHash(commitish, 'sha1') ? commitish : await resolveRef({ dir: repo.root, ref: commitish }))
    : await resolveRef({ dir: repo.root, ref: 'HEAD' });
  const branch = (commitish && !isHash(commitish, 'sha1')) ? commitish : io.extractDirname(dir);
  const gitdir = path.resolve(`${dir.toString()}/.git`);
  const worktreedir = path.join(repo.root.toString(), '/.git/worktrees', branch);
  const commondir = path.relative(worktreedir, path.join(repo.root.toString(), '.git'));
  const detached = (commitish && isHash(commitish, 'sha1')) ? commitish : undefined;

  // initialize the linked worktree
  await clone({ repo: repo, dir: dir, ref: branch });
  await checkout({ dir: dir, ref: branch });

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
  let root = await getRepoRoot(dir);
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
  const linked = exists ? await Promise.all((await io.readDirAsync(worktrees))
    .filter(a => !a.startsWith('.')) // filter for hidden files (i.e. avoid reading .DS_Store on MacOS platform)
    .map(async worktree => {
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
  const status = await getStatus(worktree.path.toString());
  if (status === 'modified' && !force) return; // cannot remove non-clean working trees (untracked files and modifications in tracked files)

  const worktreedir = (await io.readFileAsync(gitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
  const root = await getRepoRoot(worktreedir);

  await fs.remove(worktreedir); // remove the .git/worktrees/{branch} directory in the main worktree  
  await fs.remove(worktree.path.toString()); // remove the directory of the linked worktree
  if (force && root && worktree.ref) await deleteBranch({ dir: root, ref: worktree.ref }); // delete branch ref, if force param is enabled

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