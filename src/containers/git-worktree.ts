import * as fs from 'fs-extra';
import * as path from 'path';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import isHash from 'validator/lib/isHash';

import * as io from './io';
import type { Repository, Worktree } from '../types';
import { clone, currentBranch, getRepoRoot, resolveRef } from './git';

const getWorktree = async (dir: fs.PathLike, gitdir = path.join(dir.toString(), '.git'), bare = false): Promise<Worktree> => {
  const branch = await currentBranch({ dir: dir.toString(), gitdir: gitdir });
  const commit = await resolveRef({ dir: dir, ref: 'HEAD' });
  return {
    id: v4(),
    path: dir,
    bare: bare,
    detached: branch ? false : true,
    ref: branch ? branch : undefined,
    rev: commit
  };
}

export const add = async (repo: Repository, dir: fs.PathLike, commitish?: string): Promise<void> => {
  const branch = (commitish && !isHash(commitish, 'sha1')) ? commitish : io.extractDirname(dir);

  // await fs.mkdirp(path.toString());
  await clone({ repo: repo, dir: dir, ref: branch, singleBranch: true });
  await fs.remove(path.join(dir.toString(), '.git'));
  await io.writeFileAsync(path.join(dir.toString(), '.git'), `gitdir: ${repo.root.toString()}/.git/worktrees/${branch}`);

  return;
}

/**
 * List details of each working tree. The main working tree is listed first, followed by each of the linked working trees. 
 * The output details include whether the working tree is bare, the revision currently checked out, the branch currently 
 * checked out (or "detached HEAD" if none), and "locked" if the worktree is locked.
 * @param dir The working tree directory path.
 */
export const list = async (dir: fs.PathLike): Promise<Worktree[] | undefined> => {
  let root = await getRepoRoot(dir);
  if (!root) return undefined; // if there is no root, then dir is not under version control

  if (!(await io.isDirectory(`${root}/.git`))) {
    // dir points to a linked worktree, so we update root to point to the main worktree path
    const worktreeDir = (await io.readFileAsync(`${root}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
    const commonDir = (await io.readFileAsync(`${worktreeDir}/commondir`, { encoding: 'utf-8' })).trim();
    root = path.normalize(`${worktreeDir}/${commonDir}/..`);
  }

  const main = await getWorktree(root);
  const worktreesDir = path.join(root, '.git/worktrees');
  const exists = (await io.extractStats(worktreesDir)) ? true : false; // verify whether .git/worktrees exists in main worktree
  const linked = exists ? await Promise.all((await io.readDirAsync(worktreesDir)).map(async worktree => {
    const gitdir = (await io.readFileAsync(`${root}/.git/worktrees/${worktree}/gitdir`, { encoding: 'utf-8' })).trim();
    const dir = path.normalize(`${gitdir}/..`);
    return getWorktree(dir);
  })) : [];

  return [main, ...linked];
}


export const lock = (worktree: Worktree, reason?: string): void => {
  console.log({ worktree, reason });
  return;
}

export const move = (worktree: Worktree, newPath: fs.PathLike): void => {
  console.log({ worktree, newPath });
  return;
}

/**
 * Prune working tree information in `$GIT_DIR/worktrees`, specifically worktrees that were deleted without using `worktreeRemove` 
 * (or the underlying `git worktree remove` terminal command). The `expire` option further restricts which worktrees will be removed.
 * @param dir The relative or absolute directory path for the main worktree.
 * @param verbose Flag for reporting all removals.
 * @param expire Only expire unusued working trees older than a specific DateTime.
 * @param dryRun Flag for no removing anything; just reporting what would be removed.
 */
export const prune = async (dir: fs.PathLike, verbose = false, expire?: DateTime, dryRun = false): Promise<void> => {
  const worktrees = await list(dir);
  if (!worktrees) return; // if worktrees is undefined, then dir is not under version control

  const mainWorktree = worktrees?.shift(); // remove first worktree from list, since the main worktree cannot be pruned
  if (!worktrees || !mainWorktree) return; // if there is no linked or main worktrees, then pruning is a no-op

  worktrees.map(async worktree => {
    const stats = await io.extractStats(worktree.path);
    if (!stats || (expire && stats && DateTime.fromJSDate(stats.mtime) < expire)) {
      const worktreePath = path.resolve(path.join(mainWorktree.path.toString(), '.git/worktrees', worktree.ref ? worktree.ref : 'ERROR'));
      if (verbose) console.log(`Removing worktrees/${worktree.ref}: gitdir file points to non-existent location`);
      if (!dryRun) fs.remove(worktreePath);
    }
  });
}

export const remove = (worktree: Worktree, force = false): void => {
  console.log({ worktree, force });
  return;
}

export const repair = (path: fs.PathLike, ...paths: fs.PathLike[]): void => {
  console.log({ path, paths });
  return;
}

export const unlock = (worktree: Worktree): void => {
  console.log({ worktree });
  return;
}