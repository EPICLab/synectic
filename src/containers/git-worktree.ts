import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import * as io from './io';
import isHash from 'validator/lib/isHash';
import { isDefined, removeUndefinedProperties } from './utils';
import { clone, currentBranch, deleteBranch, getStatus } from './git-porcelain';
import { getIgnore, resolveEntry, resolveRef } from './git-plumbing';
import { parse } from './git-index';
import { compareStats } from './io-stats';
import { getWorktreePaths } from './git-path';
import { GitStatus, SHA1, UUID } from '../store/types';

// API SOURCE: https://git-scm.com/docs/git-worktree

export type Worktree = {
  /** The UUID for Worktree object. */
  id: UUID;
  /** The relative or absolute path to the git worktree root repository. */
  path: fs.PathLike;
  /** A flag for indicating a bare git worktree. */
  bare: boolean;
  /** A flag for indicating a detached HEAD state in the worktree. */
  detached: boolean;
  /** A flag for indicating a main worktree, as opposed to a linked worktree. */
  main: boolean;
  /** A branch name or symbolic ref (can be abbreviated). */
  ref?: string;
  /** A revision (or commit) representing the current state of `index` for the worktree. */
  rev?: SHA1 | string;
}

/**
 * Utility function for compiling all necessary information for working with either linked or main working trees 
 * (see [git-worktree](https://git-scm.com/docs/git-worktree)).
 * @param root The working tree directory path (i.e. `dir` or `worktreeDir` in `WorktreePaths` type).
 * @param bare A flag indicating a bare git worktree.
 * @return A Worktree object 
 */
const createWorktree = async (root: fs.PathLike, bare = false): Promise<Worktree> => {
  const { worktreeDir } = await getWorktreePaths(root);
  const branch = await currentBranch({ dir: root.toString() });
  const commit = await resolveRef({ dir: root, ref: 'HEAD' });
  const ref = removeUndefinedProperties({ ref: branch ? branch : undefined });
  return {
    id: v4(),
    path: path.resolve(root.toString()),
    bare: bare,
    detached: branch ? false : true,
    main: worktreeDir ? false : true,
    rev: commit,
    ...ref,
  };
}

/**
 * Efficiently get the status of multiple files in a linked worktree directory at once. This function is modeled after 
 * **isomorphic-git/statusMatrix**, even returning the same structure, but is capable of parsing paths in a linked worktree directory.
 * Only parses status for files and directories contained within the linked worktree associated with the given filepath.
 * @param filepath The relative or absolute path within a linked worktree.
 * @returns A Promise object containing an array of entries comprised of filenames and HEAD/WORKDIR/STAGE status digits, or undefined
 * if the given directory path is not under git version control.
 */
export const statusMatrix = async (filepath: fs.PathLike): Promise<[string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3][] | undefined> => {
  const { dir, worktreeDir, worktreeLink } = await getWorktreePaths(filepath);
  // if not part of a linked worktree, then `git-plumbing.matrixEntry` must be used for main worktree files
  if (!worktreeDir || !worktreeLink) return undefined;
  if (!dir) return undefined; // not under version control

  const branch = await currentBranch({ dir: worktreeDir });
  if (!branch) return undefined;

  const ignoreWorktree = await getIgnore(worktreeDir);
  // this rule is standard for git-based projects
  ignoreWorktree.add('.git');
  // .gitignore files often include 'node_modules/' as a rule, but node-ignore treats that rule as requiring the trailing '/'
  // so the 'node_module' directory will not be ignored. See: https://github.com/kaelzhang/node-ignore#2-filenames-and-dirnames
  ignoreWorktree.add('node_modules');

  // parse the appropriate git index file for evaluating staged tree status
  const indexBuffer = await io.readFileAsync(path.join(worktreeLink.toString(), 'index'));
  const index = parse(indexBuffer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
  let cache: any = {};
  // recursively walk the tree to aggregate the status of multiple files at once
  const result = await isogit.walk({
    fs: fs,
    dir: worktreeDir.toString(),
    gitdir: worktreeLink.toString(),
    trees: [isogit.TREE({ ref: branch }), isogit.WORKDIR(), isogit.STAGE()],
    cache: cache,
    map: async (filename: string, entries: (isogit.WalkerEntry | null)[]) => {
      if (!entries || filename === '.' || ignoreWorktree.ignores(filename)) return;
      const filepath = path.join(worktreeDir.toString(), filename);

      // determine oid for head tree
      const head = await resolveEntry(path.join(worktreeDir.toString(), filename), branch, cache);
      const headOid = head ? head.oid : undefined;

      const [workdir, stage] = entries.slice(1, 3);

      const headType = head && head.type;
      const [workdirType, stageType] = await Promise.all([
        workdir && workdir.type(),
        stage && stage.type()
      ]);
      const isBlob = [headType, workdirType, stageType].includes('blob');

      // bail on directories unless the file is also a blob in another tree
      if ((headType === 'tree') && !isBlob) return;
      if (headType === 'commit') return null;

      if ((workdirType === 'tree' || workdirType === 'special') && !isBlob) return;

      if (stageType === 'commit') return null;
      if ((stageType === 'tree' || stageType === 'special') && !isBlob) return;

      // determine oid for working directory tree
      let workdirOid;
      if (headType !== 'blob' && workdirType === 'blob' && stageType !== 'blob') {
        workdirOid = '42';
      } else if (workdirType === 'blob') {
        const content = await io.readFileAsync(filepath, { encoding: 'utf-8' });
        const hash = (await isogit.hashBlob({ object: content }));
        workdirOid = hash.oid;
      }

      // determine oid for index tree (staged)
      const indexEntry = index.entries.find(entry => entry.filePath === filename);
      const stageOid = indexEntry ? indexEntry.objectId.slice(2) : undefined;

      const entry = [undefined, headOid, workdirOid, stageOid];
      const result = entry.map(value => entry.indexOf(value));
      result.shift();

      return [filename, ...result];
    }
  });

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
  const { dir, worktreeDir, worktreeLink } = await getWorktreePaths(filepath);
  if (!worktreeDir || !worktreeLink) return undefined; // filepath is not part of a linked worktree, must use `git-plumbing.matrixEntry` for main worktree
  if (!dir) return undefined; // not under version control

  const relativePath = path.relative(worktreeDir.toString(), filepath.toString());
  const branch = await currentBranch({ dir: worktreeDir.toString() });
  if (!branch) return undefined;

  const ignoreWorktree = await getIgnore(worktreeDir);
  // this rule is standard for git-based projects
  ignoreWorktree.add('.git');
  // .gitignore files often include 'node_modules/' as a rule, but node-ignore treats that rule as requiring the trailing '/'
  // so the 'node_module' directory will not be ignored. See: https://github.com/kaelzhang/node-ignore#2-filenames-and-dirnames
  ignoreWorktree.add('node_modules');
  if (ignoreWorktree.ignores(relativePath)) return 'ignored';

  // determine oid for HEAD tree
  const entry = await resolveEntry(filepath, branch);
  if (!entry) return undefined;
  const treeOid = (await isogit.readBlob({ fs: fs, dir: dir.toString(), oid: entry.oid })).oid;

  // parse the appropriate git index file for evaluating staged tree status
  const indexBuffer = await io.readFileAsync(path.join(worktreeLink.toString(), 'index'))
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
 * Create a new directory and checkout a branch (either creating a new branch or switching to an existing branch) into the
 * new directory. The new working directory is linked to the current repository, sharing everything except working directory
 * specific files such as `HEAD`, `index`, etc. Adheres to the specifications of the `git worktree add` command, see:
 * https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-addltpathgtltcommit-ishgt
 * @param dir The relative or absolute path to the main worktree root directory.
 * @param worktreeDir The relative or absolute path to create the new linked worktree; will create a new directory if none is found.
 * @param url The URL associated with a remote-hosted instances of the repository; use empty string if local-only repository.
 * @param commitish A branch name or symbolic ref.
 * @return A Promise object for the add worktree operation.
 */
export const add = async (dir: fs.PathLike, worktreeDir: fs.PathLike, url: string, commitish?: string): Promise<void> => {
  const branch = (commitish && !isHash(commitish, 'sha1')) ? commitish : io.extractDirname(worktreeDir);
  const worktreeGitdir = path.resolve(path.join(worktreeDir.toString(), '.git'));
  const worktreeLink = path.join(dir.toString(), '.git', 'worktrees', branch);
  const commondir = path.relative(worktreeLink, path.join(dir.toString(), '.git'));
  const detached = (commitish && isHash(commitish, 'sha1')) ? commitish : undefined;

  // initialize the linked worktree
  await clone({ dir: worktreeDir, repo: { root: dir, url: url }, ref: branch, noCheckout: true });
  const remoteBranches = await isogit.listBranches({ fs: fs, dir: dir.toString(), remote: 'origin' });
  if (remoteBranches.includes(branch)) {
    await isogit.checkout({ fs: fs, dir: worktreeDir.toString(), ref: branch });
  } else {
    // if no remote branch exists, then create a new local-only branch and switches branches in the linked worktree
    await isogit.branch({ fs: fs, dir: dir.toString(), ref: branch, checkout: false });
    await isogit.checkout({ fs: fs, dir: worktreeDir.toString(), ref: branch, noCheckout: true });
  }

  // branch must already exist in order to resolve worktreeLink path (`GIT_DIR/worktrees/{branch}`)
  const commit = commitish ? (isHash(commitish, 'sha1') ? commitish : await resolveRef({ dir: worktreeDir, ref: commitish }))
    : await resolveRef({ dir: dir, ref: 'HEAD' });

  // populate internal git files in main worktree to recognize the new linked worktree
  await fs.ensureDir(worktreeLink);
  await fs.copy(path.resolve(`${worktreeDir}/.git/HEAD`), path.join(worktreeLink, 'HEAD'));
  detached ? await io.writeFileAsync(path.join(worktreeLink, 'HEAD'), detached + '\n')
    : await fs.copy(path.resolve(`${worktreeDir}/.git/index`), `${worktreeLink}/index`);
  await io.writeFileAsync(path.resolve(`${worktreeLink}/${commondir}/refs/heads/${branch}`), commit + '\n');
  await io.writeFileAsync(path.join(worktreeLink, 'ORIG_HEAD'), commit + '\n');
  await io.writeFileAsync(path.join(worktreeLink, 'commondir'), commondir + '\n');
  await io.writeFileAsync(path.join(worktreeLink, 'gitdir'), worktreeGitdir + '\n');

  // // overwrite the internal git files in linked worktree to point to main worktree
  await fs.remove(worktreeGitdir);
  await io.writeFileAsync(worktreeGitdir, `gitdir: ${worktreeLink}\n`);
  return;
}

/**
 * List details of each working tree. Resulting array contains the main working tree as the first element, followed by each of the linked 
 * working trees found in `GIT_DIR/worktrees`. The output details include whether the working tree is bare, the revision currently checked 
 * out, the branch currently checked out (or "detached HEAD" if none), and "locked" if the worktree is locked.
 * @param target The relative or absolute path to any working tree directory (main or linked worktree).
 * @return A Promise containing an array of worktree details, or undefined if not under version control.
 */
export const list = async (target: fs.PathLike): Promise<Worktree[] | undefined> => {
  const { dir, worktrees } = await getWorktreePaths(target);
  if (!dir) return; // not under version control
  const main = await createWorktree(dir.toString());

  // GIT_DIR/worktrees will only exist if at least one linked worktree has been added to the repository (even if it was later deleted)
  const linked = worktrees ? (await Promise.all((await io.readDirAsync(worktrees))
    .filter(a => !a.startsWith('.')) // filter for hidden files (i.e. avoid reading .DS_Store on MacOS platform)
    .map(async branch => {
      const { worktreeDir } = await getWorktreePaths(path.join(worktrees.toString(), branch));
      return worktreeDir ? await createWorktree(worktreeDir) : undefined;
    }))).filter(isDefined) : [];

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
 * Prune working tree information in `GIT_DIR/worktrees`, specifically worktrees that were deleted without using 
 * `worktreeRemove` (or the underlying `git worktree remove` terminal command). The `expire` option further restricts 
 * which worktrees will be removed based on a specific datetime threshold.
 * @param worktreesPath The linked worktrees directory (i.e. `GIT_DIR/worktrees`).
 * @param verbose Flag for reporting all removals.
 * @param expire Only expire unusued working trees older than a specific DateTime.
 * @param dryRun Flag for not removing anything; just reporting what would be removed.
 * @return A Promise for the prune worktree command.
 */
export const prune = async (worktreesPath: fs.PathLike, verbose = false, expire?: DateTime, dryRun = false): Promise<void> => {
  if (!(await io.extractStats(worktreesPath))) return; // cannot prune non-existent git directory
  const worktrees = await list(worktreesPath);
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
 * Remove a linked working tree, when it is in a clean state (no untracked files and no modifications in tracked files).
 * Unclean working trees or ones with submodules can be removed by enabling the `force` option. When enabled, `force` will 
 * also delete the branch associated with the linked worktree.
 * @param worktree A Worktree object containing details of the linked worktree to be removed.
 * @param force Flag for deleting the linked worktree (and branch) even if the currently in a dirty worktree state.
 * @return A Promise for the removing worktree command.
 */
export const remove = async (worktree: Worktree, force = false): Promise<void> => {
  const { dir, worktreeDir, worktreeGitdir, worktreeLink } = await getWorktreePaths(worktree.path);

  if (!worktreeDir || !worktreeGitdir || !worktreeLink) return; // main worktree cannot be removed
  if (!(await io.extractStats(worktreeGitdir))) return; // cannot remove non-existent git directory

  const status = await getStatus(worktreeGitdir);
  // cannot remove non-clean working trees (untracked files and modifications in tracked files)
  if (status === 'modified' && !force) return;

  await fs.remove(worktreeLink.toString()); // remove the .git/worktrees/{branch} directory in main worktree
  await fs.remove(worktreeDir.toString()); // remove the linked worktree directory
  if (force && dir && worktree.ref) await deleteBranch({ dir: dir, ref: worktree.ref });

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