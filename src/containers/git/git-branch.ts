import { PathLike } from 'fs-extra';
import { Branch } from '../../store/slices/branches';
import { execute, isDefined, WithRequired } from '../utils';

type BranchOutput = WithRequired<Partial<Omit<Branch, 'id'>>, 'ref'>;

/**
 * List branches. The default is to list local branches (similar to `git branch`). Enabling additional options expands the output. 
 * Matches the functionality of [`git-branch`](https://git-scm.com/docs/git-branch).
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.showCurrent - Optional flag to only print the name of the current branch. In detached HEAD state, nothing is printed.
 * @param obj.all - Optional flag to list both remote-tracking branches and local branches.
 * @param obj.remotes - Optional flag to list the remote-tracking branches.
 * @param obj.verbose - Optional flag to show SHA-1 and commit subject line for each head, along with relationship to upstream 
 * branch (if any).
 * @returns {Promise<ReturnType<typeof processBranchOutput>>} A Promise object containing an array of {@link BranchOutput} objects 
 * representing known branch information.
 */
export const listBranch = async ({
    dir, showCurrent = false, all = false, remotes = false, verbose = false
}: {
    dir: PathLike;
    showCurrent?: boolean;
    all?: boolean;
    remotes?: boolean;
    verbose?: boolean;
}): Promise<ReturnType<typeof processBranchOutput>> => {
    const verboseOption = verbose ? '--verbose --no-abbrev' : '';

    // Remove any remote-tracking references that no longer exist on the remote
    // TODO: Migrate into any future `git-fetch` implementation
    const cleanup = await execute(`git fetch --prune -a`, dir.toString());
    if (cleanup.stderr.length > 0) console.error(cleanup.stderr);
    if (cleanup.stdout.length > 0) console.log(cleanup.stdout);

    if (showCurrent) {
        const output = await execute(`git branch --show-current`, dir.toString());
        if (output.stderr.length > 0) console.error(output.stderr);
        return [{ ref: output.stdout.replace(/[\n\r]/g, '') }];
    }

    if (all) {
        const output = await execute(`git branch --all ${verboseOption}`, dir.toString());
        if (output.stderr.length > 0) console.error(output.stderr);
        return processBranchOutput(output.stdout);
    }

    if (remotes) {
        const output = await execute(`git branch --remotes ${verboseOption}`, dir.toString());
        if (output.stderr.length > 0) console.error(output.stderr);
        return processBranchOutput(output.stdout);
    }

    const output = await execute(`git branch ${verboseOption}`, dir.toString());
    if (output.stderr.length > 0) console.error(output.stderr);
    return processBranchOutput(output.stdout);
}

/**
 * Create a new branch head named `branchName` which points to the current HEAD, or `startPoint` if given. As a special
 * case for `startPoint`, you may use `"A...B"` as a shortcut for the merge base of `A` and `B` if there is exactly one
 * merge base. You can leave out at most on of `A` or `B`, in which case it defaults to HEAD. Matches the functionality 
 * of [`git-branch`](https://git-scm.com/docs/git-branch).
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.branchName - Branch name that should be created.
 * @param obj.startPoint - The new branch head will point to this commit. It may be given as a branch name, a commit id,
 * or a tag. If this option is omitted, the current HEAD will be used instead.
 * @param obj.force - Optional flag to reset `branchName` to `startPoint`, even if `branchName` exists already. Otherwise,
 * this command refuses to change an existing branch.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the branch was successfully created.
 */
export const createBranch = async ({
    dir, branchName, startPoint = 'HEAD', force = false
}: {
    dir: PathLike;
    branchName: string;
    startPoint?: string;
    force?: boolean;
}): Promise<boolean> => {
    const output = await execute(`git branch ${branchName} ${startPoint} ${force ? '--force' : ''}`, dir.toString());
    if (output.stderr.length > 0) {
        console.error(output.stderr);
        return false;
    }
    return true;
}

/**
 * Set up the branch tracking information so that `upstream` is considered the `branchName`'s upstream branch. If no `branchName` 
 * is specified, then it defaults to the current branch in the worktree root directory. This can also be achieved using 
 * `git push --set-upstream`. Matches the functionality of [`git-branch`](https://git-scm.com/docs/git-branch).
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.upstream - The remote name (e.g. `origin`).
 * @param obj.branchName - Optional branch name that should be updated; defaults to the current branch if not provided.
 */
export const setUpstreamBranch = async ({
    dir, upstream, branchName
}: {
    dir: PathLike;
    upstream: string;
    branchName?: string;
}) => {
    const output = await execute(`git branch --set-upstream-to=${upstream} ${branchName ? branchName : ''}}`, dir.toString());
    if (output.stderr.length > 0) console.error(output.stderr);
    if (output.stdout.length > 0) console.log(output.stdout);
}

/**
 * Remove the upstream information for `branchName`. If no branch is specified it defaults to the current branch. Matches the 
 * functionality of [`git-branch`](https://git-scm.com/docs/git-branch).
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.branchName - Optional branch name that should be updated; defaults to the current branch if not provided.
 */
export const unsetUpstreamBranch = async ({
    dir, branchName
}: {
    dir: PathLike;
    branchName?: string;
}) => {
    const output = await execute(`git branch --unset_upstream ${branchName ? branchName : ''}}`, dir.toString());
    if (output.stderr.length > 0) console.error(output.stderr);
    if (output.stdout.length > 0) console.log(output.stdout);
}

/**
 * Move/rename a branch, together with its config and reflog. 
 * Matches the functionality of [`git-branch`](https://git-scm.com/docs/git-branch).
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.newBranch - New branch name.
 * @param obj.oldBranch - Optional old branch name that will be renamed to the new branch name. If the old branch had a corresponding
 * reflog, it is renamed to match new branch name, and a reflog entry is created to remember the branch renaming. If new branch name
 * exists, then `force` must be used for the rename to happen.
 * @param obj.force - Optional flag to allow renaming the branch even if the new branch name already exists.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the branch was successfully moved.
 */
export const moveBranch = async ({
    dir, newBranch, oldBranch, force = false
}: {
    dir: PathLike;
    newBranch: string;
    oldBranch?: string;
    force?: boolean;
}): Promise<boolean> => {
    const output = await execute(`git branch ${force ? '--move --force' : '--move'} ${oldBranch ? oldBranch : ''} ${newBranch}`, dir.toString());
    if (output.stderr.length > 0) {
        console.error(output.stderr);
        return false;
    }
    if (output.stdout.length > 0) console.log(output.stdout);
    return true;
}

/**
 * Copy a branch, together with its config and reflog. Matches the functionality of [`git-branch`](https://git-scm.com/docs/git-branch).
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.newBranch - New branch name.
 * @param obj.oldBranch - Optional old branch name that will be copied to the new branch name, along with its config and reflog.
 * @param obj.force - Optional flag to allow copying the branch even if the new branch name already exists.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the branch was successfully copied.
 */
export const copyBranch = async ({
    dir, newBranch, oldBranch, force = false
}: {
    dir: PathLike;
    newBranch: string;
    oldBranch?: string;
    force?: boolean;
}): Promise<boolean> => {
    const output = await execute(`git branch ${force ? '--copy --force' : '--copy'} ${oldBranch ? oldBranch : ''} ${newBranch}`, dir.toString());
    if (output.stderr.length > 0) {
        console.error(output.stderr);
        return false;
    }
    if (output.stdout.length > 0) console.log(output.stdout);
    return true;
}

/**
 * Delete a branch. The branch must be fully merged in its upstream branch, or in HEAD if no upstream was set with `git branch --track` or 
 * `git branch --set-upstream-to`. Matches the functionality of [`git-branch`](https://git-scm.com/docs/git-branch).
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.branchName - The branch to be deleted. You may specify more than one branch for deletion. If the branch currently has a reflog
 * then the reflog will also be deleted.
 * @param obj.remote - Optional flag to delete remote-tracking branches. Note, that it only makes sense to delete remote-tracking branches
 * if they no longer exist in the remote repository or if `git fetch` was configured not to fetch them again.
 * @param obj.force - Optional flag to allow deleting the branch irrespective of its merged status, or whether it even points to a valid commit.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the branch was successfully deleted.
 */
export const deleteBranch = async ({
    dir, branchName, remote = false, force = false
}: {
    dir: PathLike;
    branchName: string;
    remote?: boolean;
    force?: boolean;
}) => {
    const output = await execute(`git branch ${force ? '--delete --force' : '--delete'} ${remote ? '-r' : ''} ${branchName}`, dir.toString());
    if (output.stderr.length > 0) {
        console.error(output.stderr);
        return false;
    }
    if (output.stdout.length > 0) console.log(output.stdout);
    return true;
}

export const processBranchOutput = (output: string): BranchOutput[] => {
    const result: BranchOutput[] = output.split(/\r?\n/).map(line => {
        /**
         * Regex pattern matches with the following capture groups:
         * [1] type of branch (`* ` indicates current branch, `+ ` indicates branch checked out into linked worktree)
         * [2] branch ref (e.g. `master` or `remotes/origin/feature`)
         * [3] points-to ref (i.e. the name of the branch pointed to by this ref; `origin/master` from `remotes/origin/HEAD -> origin/master`)
         * [4] sha1 hash for the head of the branch (e.g. `e41340ac4`)
         * [5] commit subject line for the head of the branch (e.g. `style: add divider rtl support (#23734)`)
         */
        const linePattern = new RegExp('^(.{2})(\\S+)(?:(?: *-> )(\\S+))?(?:(?: +)([0-9a-f]{1,40}) (.*))?', 'g');

        /**
         * Regex pattern matches with the following capture groups:
         * [1] remote repository alias (i.e. only present if ref is for a remote branch; typically set to `origin`)
         * [2] branch ref (e.g. `main`)
         */
        const refPattern = new RegExp('(?:remotes/(?:(\\w+)/))?(.*)', 'g');

        const lineResult = linePattern.exec(line);
        const branchRef = lineResult?.[2];
        const head = lineResult?.[4];
        const refResult = branchRef ? refPattern.exec(branchRef) : undefined;
        const ref = refResult?.[2];
        const scope: 'local' | 'remote' = refResult?.[1] ? 'remote' : 'local';
        const remote = refResult?.[1] ? refResult?.[1] : 'origin';
        return ref ? { ref: ref, scope: scope, remote: remote, ...(head && { head }) } : undefined;
    }).filter(isDefined);
    return result;
}