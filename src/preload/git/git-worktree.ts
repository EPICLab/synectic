import type { PathLike } from 'fs-extra';
import type { Branch } from 'types/branch';
import type { Expand, WithRequired } from 'types/util';
import { execute } from '../io';
import { isDefined, removeNullableProperties } from '../utils';
import { checkGitVersion } from './git-version';

type BranchOutput = Expand<WithRequired<Partial<Omit<Branch, 'id'>>, 'ref'>>;

/**
 * Create a worktree at `path` and checkout `commitish` into it. The new worktree is linked to the
 * current repository, sharing everything except per-workrtree files such as `HEAD`, `index`, etc.
 * As a convenience, `commitish` may be a bare `"-"`, which is synonymous with `@{-1}`. Matches the
 * functionality of [`git-worktree.add`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-addltpathgtltcommit-ishgt)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory of the main worktree in the repository (i.e. the
 * worktree directory containing a `.git` directory).
 * @param obj.path - The worktree root directory where the new worktree will be created.
 * @param obj.force - Optional flag to override the safeguards that prevent creating a new wortkree
 * when `commitish` is a branch name and is already checked out by another worktree, or if `path` is
 * already assigned to some worktree but is missing.
 * @param obj.detach - Optional flag to detach HEAD in the new worktree.
 * @param obj.checkout - Optional flag to enable/disable the suppression of checkout in order to
 * make customizations, such as configuring sparse-checkout.
 * @param obj.lock - Keep the worktree locked after creation. This is the equivalent of `git
 * worktree lock` after `git worktree add`, but without a race condition.
 * @param obj.newBranch - Create a new branch using the provided name starting at `commitish`, and
 * checked out into the new worktree. Defaults to `HEAD`.
 * @param obj.commitish - The SHA1 commit hash or branch name to checkout into the `path` directory.
 * @param obj.quiet - Optional flag to suppress feedback messages.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the worktree
 * was successfully added.
 */
export const worktreeAdd = async ({
  dir,
  path,
  force = false,
  detach = false,
  checkout = true,
  lock = false,
  newBranch,
  commitish,
  quiet = false
}: {
  dir: PathLike;
  path: PathLike;
  force?: boolean;
  detach?: boolean;
  checkout?: boolean;
  lock?: false | (true & { reason?: string });
  newBranch?: string;
  commitish?: string;
  quiet?: false;
}): Promise<boolean> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: [
      'worktree',
      'add',
      force ? '--force' : '',
      detach ? '--detach' : '',
      checkout ? '' : '--no-checkout',
      lock ? `--lock ${lock.reason ?? ''}` : '',
      newBranch ? `-b ${newBranch}` : '',
      path.toString(),
      commitish ?? ''
    ],
    cwd: dir.toString()
  });
  if (
    !quiet &&
    (output.stderr?.search(/fatal:/) !== -1 || output.stderr?.search(/Preparing worktree/) == -1)
  ) {
    // Note: `git worktree add` behaves slightly strange and outputs "Preparing worktree (checking
    // out 'branch name')" in `stderr` on success
    console.error(output.stderr);
    return false;
  }
  if (!quiet && output.stdout) console.log(output.stdout);
  return true;
};

/**
 * List details of each worktree. The main worktree is listed first, followed by each of the linked
 * worktrees. The output details include whether the worktree is bare, the revision currently
 * checked out, the branch currently checked out (or "detached HEAD" if none), "locked" if the
 * worktree is locked, "prunable" if the worktree can be pruned by the {@link worktreePrune}
 * command. Matches the functionality of
 * [`git-worktree.list`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-list)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.verbose - Optional flag to output additional information about worktrees.
 * @param obj.porcelain - Optional flag to output in an easy-to-parse format for scripts.
 * @returns {Promise<ReturnType<typeof processWorktreeOutput>>} A Promise object containing a list
 * of {@link BranchOutput} objects representing each worktree.
 */
export const worktreeList = async ({
  dir,
  verbose = false,
  porcelain = false
}: {
  dir: PathLike;
  verbose?: boolean;
  porcelain?: boolean;
}): Promise<ReturnType<typeof processWorktreeOutput>> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: ['worktree', 'list', verbose ? '--verbose' : '', porcelain ? '--porcelain' : ''],
    cwd: dir.toString()
  });
  if (output.stderr) console.error(output.stderr);
  return processWorktreeOutput(output.stdout, porcelain);
};

/**
 * If a worktree is on a portable device or network share which is not always mounted, lock it to
 * prevent its administrative files from being pruned automatically. This also prevents it from
 * being moved or deleted. Matches the functionality of
 * [`git-worktree.lock`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-lock)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.worktree - Worktrees can be identified by path, either relative or absolute. If the
 * last path components in the worktree's path is unique among worktrees, it can be used to identify
 * a worktree.
 * @param obj.reason - Optional explanation why the worktree is locked.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the worktree
 * was successfully locked.
 */
export const worktreeLock = async ({
  dir,
  worktree,
  reason
}: {
  dir: PathLike;
  worktree: string;
  reason?: string;
}): Promise<boolean> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: ['worktree', 'lock', reason ? `--reason "${reason}"` : '', worktree.toString()],
    cwd: dir.toString()
  });
  // TODO: false should be returned when the output is `fatal: {worktree} is already locked`
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }
  if (output.stdout) console.log(output.stdout);
  return true;
};

/**
 * Move a worktree to a new location. Note that the main worktree or linked worktrees containing
 * submodules cannot be moved with this command. (The {@link worktreeRepair} command, however, can
 * re-establish the connection with linked worktrees if you move the main worktree manually.)
 * Matches the functionality of
 * [`git-worktree.move`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-move)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.worktree - Worktrees can be identified by path, either relative or absolute. If the
 * last path components in the worktree's path is unique among worktrees, it can be used to identify
 * a worktree.
 * @param obj.newPath - The new path to move the worktree to.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the worktree
 * was successfully moved.
 */
export const worktreeMove = async ({
  dir,
  worktree,
  newPath
}: {
  dir: PathLike;
  worktree: string;
  newPath: PathLike;
}): Promise<boolean> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: ['worktree', 'move', worktree.toString(), newPath.toString()],
    cwd: dir.toString()
  });
  // TODO: false should be returned when the output is `fatal: {worktree} is locked`
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }
  if (output.stdout) console.log(output.stdout);
  return true;
};

/**
 * Utility type for expressing expiration times in the supported Git format. Valid inputs include:
 * | format           | description                                                          |
 * | ---------------- | -------------------------------------------------------------------- |
 * | `{n}.days`       | Restricts expiration to worktrees older than `n` days from today.    |
 * | `{n}.weeks.ago`  | Restricts expiration to worktrees older than `n` weeks from today.   |
 * | `{n}.months.ago` | Restricts expiration to worktrees older than `n` months from today.  |
 * | `now`            | Expires all worktrees immediately.                                   |
 * | `never`          | Suppresses expiration altogether.                                    |
 */
type ExpireTime =
  | 'now'
  | `${number}.day`
  | `${number}.weeks.ago`
  | `${number}.months.ago`
  | `${number}.years.ago`
  | 'never';

/**
 * Prune worktree information in `$GIT_DIR/worktrees` to remove any stale administrative files,
 * unless the worktree is `locked` via `git worktree lock` command. Matches the functionality of
 * [`git-worktree.prune`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-prune)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.dryRun - Do not remove anything; just report what it would remove.
 * @param obj.verbose - Report all removals.
 * @param obj.expire - Only expire unused worktrees older than the {@link ExpireTime} restriction.
 */
export const worktreePrune = async ({
  dir,
  dryRun = false,
  verbose = false,
  expire
}: {
  dir: PathLike;
  dryRun?: boolean;
  verbose?: boolean;
  expire?: ExpireTime;
}): Promise<void> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: [
      'worktree',
      'prune',
      dryRun ? '--dry-run' : '',
      verbose ? '--verbose' : '',
      expire ? `--expire=${expire}` : ''
    ],
    cwd: dir.toString()
  });
  // TODO: Properly format the outputs for the `dryRun` and `verbose` options such that they can be ingested by other functions
  if (output.stderr) console.error(output.stderr);
  if (verbose && output.stdout) console.log(output.stdout);
};

/**
 * Remove a worktree. Only clean worktrees (no untracked files and no modification in tracked files)
 * can be removed. Unclean worktrees or ones with submodules can be removed with the `force` option
 * enabled. The main worktree cannot be removed. Matches the functionality of
 * [`git-worktree.remove`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-remove)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.worktree - The branch name associated with the worktree.
 * @param obj.force - Optional flag to override the safeguards that prevent removing unclean
 * worktrees or ones with submodules.
 * @returns {boolean} A Promise object containing a boolean indicating whether the worktree was
 * successfully removed.
 */
export const worktreeRemove = async ({
  dir,
  worktree,
  force = false
}: {
  dir: PathLike;
  worktree: string;
  force?: boolean;
}): Promise<boolean> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: ['worktree', 'remove', force ? '--force' : '', worktree.toString()],
    cwd: dir.toString()
  });
  // TODO: false should be returned when the output is `fatal: {worktree} is locked`
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }
  if (output.stdout) console.log(output.stdout);
  return true;
};

/**
 * Repair worktree administrative files, if possible, if they have become corrupted or outdated due
 * to external factors. For instance, if the main worktree (or bare repository) is moved, linked
 * worktrees will be unable to locate it. Running `git worktree repair` in the main worktree will
 * re-establish the connection from linked worktrees back to the main worktree. Similarly, if the
 * working tree for a linked worktree is moved without using `git worktree move`, the main worktree
 * (or bare repository) will be unable to locate it. Running `git worktree repair` within the
 * recently-moved worktree will reestablish the connection. Matches the functionality of
 * [`git-worktree.repair`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-repairltpathgt82308203)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.paths - List of new paths for linked worktrees that were moved, so that the connection
 * to all the specified paths is reestablished.
 */
export const worktreeRepair = async ({
  dir,
  paths
}: {
  dir: PathLike;
  paths?: PathLike[];
}): Promise<void> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: ['worktree', 'repair', ...(paths?.map(toString) ?? [])],
    cwd: dir.toString()
  });
  if (output.stderr) console.error(output.stderr);
  if (output.stdout) console.log(output.stdout);
};

/**
 * Unlock a worktree, allowing it to be pruned, moved or deleted. Matches the functionality of
 * [`git-worktree.unlock`](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-unlock)
 * command.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.worktree - The branch name associated with the worktree.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the worktree
 * was successfully unlocked.
 */
export const worktreeUnlock = async ({
  dir,
  worktree
}: {
  dir: PathLike;
  worktree: string;
}): Promise<boolean> => {
  await checkGitVersion('>=2.5'); // Linked worktrees require minimum git version 2.5: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/
  const output = await execute({
    command: 'git',
    args: ['worktree', 'unlock', worktree.toString()],
    cwd: dir.toString()
  });
  // TODO: false should be returned when the output is `fatal: {worktree} is not locked`
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }
  if (output.stdout) console.log(output.stdout);
  return true;
};

export const processWorktreeOutput = (
  output: string | undefined,
  porcelain = false
): BranchOutput[] => {
  if (!isDefined(output)) return [];
  if (porcelain) {
    /**
     * Regex patterns that matches the following capture groups:
     * [1] worktree root directory path
     * [2] sha1 hash for the head of the branch (e.g. `e629b39c2`)
     * [3] indicator for a bare repository state
     * [4] branch ref; shortened (e.g. `master` from `refs/heads/master`)
     * [5] indicator for a detached HEAD state
     * [6] indicator for a locked worktree
     * [7] indicator for a prunable worktree (i.e. `prunable` if the worktree can be pruned via
     *     `git worktree prune`)
     */
    const linePattern = new RegExp(
      '(?:worktree )(\\S+)(?:(?:\\r?\\nHEAD )([0-9a-f]{1,40}))?(?:(?:\\r?\\n)(bare))?(?:(?:\\r?\\nbranch )(\\S+))?(?:\\r?\\n(detached))?(?:\\r?\\n(locked))?(?:\\r?\\n(prunable))?',
      'gm'
    );
    return Array.from(output.matchAll(linePattern), line => {
      const worktree = line[1];
      const head = line[2];
      const bare = line[3] == 'bare';
      const detached = line[5] === 'detached';
      const branch = bare ? '' : detached ? 'detached' : line[4]?.replace('refs/heads/', '');
      // @ts-ignore
      const locked = line[6] === 'locked';
      // @ts-ignore
      const prunable = line[7] === 'prunable';
      return isDefined(branch)
        ? ({
            ref: branch,
            bare: bare,
            scope: 'local',
            ...removeNullableProperties({ root: worktree, head: head })
          } as BranchOutput)
        : undefined;
    }).filter(isDefined);
  } else {
    /**
     * Regex patterns that matches the following capture groups:
     * [1] worktree root directory path
     * [2] sha1 hash for the head of the branch (e.g. `e629b39c2`)
     * [3] indicators for detached HEAD and bare repository states, or the branch ref (.e.g `master`)
     * [4] branch state (i.e. `locked` if the worktree is locked, `prunable` if the worktree can be
     *     pruned via `git worktree prune`)
     * [5] reason for `locked`/`prunable` state
     */
    const linePattern = new RegExp(
      '^(\\S+)\\s+([0-9a-f]{1,40})?\\s+(?:[\\[\\(]([\\w -]+)[\\)\\]])(?:(?: |\\r?\\n\\t)(locked|prunable)(?:\\: (.*))?)?',
      'gm'
    );
    return Array.from(output.matchAll(linePattern), line => {
      const worktree = line[1];
      const head = line[2];
      const detached = line[3] === 'detached HEAD';
      const bare = line[3] === 'bare';
      const branch = bare ? '' : detached ? 'detached' : line[3];
      return isDefined(branch)
        ? ({
            ref: branch,
            bare: bare,
            scope: 'local',
            ...removeNullableProperties({ root: worktree, head: head })
          } as BranchOutput)
        : undefined;
    }).filter(isDefined);
  }
};
