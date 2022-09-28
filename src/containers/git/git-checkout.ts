import * as fs from 'fs-extra';
import { execute } from '../utils';

/**
 * Updates the files in the working tree to match the version in the index or the specified tree. If no pathspec was
 * given, this command will also update HEAD to set the specified branch as the current branch. Matches the functionality 
 * of [`git-checkout`](https://git-scm.com/docs/git-checkout).
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.branch - The branch name to switch to by updating the index and files in the working tree, and by pointing
 * HEAD at the branch.
 * @param obj.quiet - Optional flag to suppress feedback messages.
 * @param obj.force - When switching branches, proceed even if the index or the working tree differs from HEAD, and even if
 * there are untracked files in the way. When checking out paths from the index, do not fail upon unmerged entries; 
 * instead, unmerged entries are ignored.
 * @param obj.merge - When switching branches, if you have local modifications to one or more files that are different between
 * the current branch and the branch to which you are switching, the command refuses to switch branches in order to
 * preserve your modifications in context. However, with this option, a three-way merge between the current branch,
 * your working tree contents, and the new branch is done, and you will be on the new branch.
 */
export const checkoutBranch = async ({
    dir, branch, quiet = false, force = false, merge = false
}: {
    dir: fs.PathLike;
    branch: string;
    quiet?: boolean;
    force?: boolean;
    merge?: boolean;
}): Promise<void> => {
    const output = await execute(`git checkout ${branch} ${force ? '--force' : ''} ${merge ? '--merge' : ''}`, dir.toString());
    if (!quiet && output.stderr.length > 0) console.error(output.stderr);
}

/**
 * Prepare to work on top of `commitish`, by detaching HEAD at it, and updating the index and the files in the working
 * tree. Local modifications to the files in the working tree are kept, so that the resulting working tree will be the
 * state recorded in the commit plus the local modifications. When the `commitish` argument is a branch name, this 
 * command will detach HEAD at the tip of the branch. Matches the functionality of 
 * [`git-checkout`](https://git-scm.com/docs/git-checkout).
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.commitish - The SHA1 commit hash or branch name to check out.
 * @param obj.quiet - Optional flag for quiet, to suppress feedback messages.
 * @param obj.force - When switching branches, proceed even if the index or the working tree differs from HEAD, and even if
 * there are untracked files in the way. When checking out paths from the index, do not fail upon unmerged entries; 
 * instead, unmerged entries are ignored.
 * @param obj.merge - When switching branches, if you have local modifications to one or more files that are different between
 * the current branch and the branch to which you are switching, the command refuses to switch branches in order to
 * preserve your modifications in context. However, with this option, a three-way merge between the current branch,
 * your working tree contents, and the new branch is done, and you will be on the new branch.
 */
export const checkoutDetached = async ({
    dir, commitish, quiet = false, force = false, merge = false
}: {
    dir: fs.PathLike;
    commitish: string;
    quiet: boolean;
    force: boolean;
    merge: boolean;
}): Promise<void> => {
    const output = await execute(`git checkout --detach ${commitish} ${force ? '--force' : ''} ${merge ? '--merge' : ''}`, dir.toString());
    if (!quiet && output.stderr.length > 0) console.error(output.stderr);
    if (!quiet && output.stdout.length > 0) console.log(output.stdout);
}

/**
 * A new branch will be created as if [`git-branch`](https://git-scm.com/docs/git-branch) were called and then checked out.
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory. Matches the functionality of [`git-checkout`](https://git-scm.com/docs/git-checkout).
 * @param obj.newBranch - The branch name to be created.
 * @param obj.startPoint - The new branch head will point to this commit. It may be given as a branch name, a commit id, or a tag. 
 * If this option is omitted, the current HEAD will be used instead.
 * @param obj.force - The new branch is created if it doesn't exist; otherwise, it is reset.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the branch was successfully created.
 */
export const checkoutNewBranch = async ({
    dir, newBranch, startPoint, force = false
}: {
    dir: fs.PathLike;
    newBranch: string;
    startPoint: string;
    force: boolean;
}): Promise<boolean> => {
    const output = await execute(`git checkout ${force ? '-B' : '-b'} ${newBranch} ${startPoint ? startPoint : ''}`, dir.toString());
    if (output.stderr.length > 0) {
        console.error(output.stderr);
        return false;
    }
    return true;
}