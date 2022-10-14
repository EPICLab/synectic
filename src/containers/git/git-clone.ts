import { pathExists, PathLike } from 'fs-extra';
import { dirname } from 'path';
import { execute } from '../utils';

/**
 * Clone a repository into a new directory.
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.repo - The URL of a remote repository, or the path to a local repository.
 * @param obj.branch - Instead of pointing the newly created HEAD to the branch pointed to by the cloned repository's
 * HEAD, point to this branch name or SHA-1 instead. In a non-bare repository, this is the branch that will be checked out.
 * @param obj.bare - Make a `bare` Git repsoitory. That is, instead of creating a directory and placing the administrative
 * files in the `.git` sub-directory, make the directory itself the `$GIT_DIR`. This implies `--no-checkout` because there 
 * is nowhere to check out the working tree. Also the branch heads at the remote are copied directly to corresponding local
 * branch heads, without mapping them to `refs/remotes/origin/`. When this option is used, neither remote-tracking branches 
 * nor the related configuration variables are created.
 * @param obj.singleBranch - Clone only the history leading to the tip of a single branch, either specified by the `--branch` 
 * option or the primary branch remote’s HEAD points at. Further fetches into the resulting repository will only update the 
 * remote-tracking branch for the branch this option was used for the initial cloning. If the HEAD at the remote did not point 
 * at any branch when `singleBranch` clone was made, no remote-tracking branch is created.
 * @param obj.noCheckout - No checkout of HEAD is performed after the clone is complete.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the clone operation succeeded.
 */
export const cloneRepo = async ({
    dir, repo, branch, bare, singleBranch, noCheckout
}: {
    repo: URL | PathLike;
    dir: PathLike;
    branch?: string;
    bare?: boolean;
    singleBranch?: boolean;
    noCheckout?: boolean;
}): Promise<boolean> => {
    const parentDir = dirname(dir.toString()); // the `dir` directory doesn't exist yet, so start from parent
    if (!(await pathExists(parentDir))) throw new Error(`ENOENT: no such file or directory, clone attempted in '${parentDir}'`);
    const bareOption = bare ? `--bare` : '';
    const noCheckoutOption = noCheckout ? `--no-checkout` : '';
    const singleBranchOption = singleBranch ? `--single-branch` : '';
    const branchOption = branch ? `--branch ${branch}` : '';
    const output = await execute(`git clone ${repo.toString()} ${dir.toString()} ${branchOption} ${bareOption} ${noCheckoutOption} ${singleBranchOption}`, parentDir.toString());

    if (output.stderr.length > 0) {
        console.error(output.stderr);
        return false;
    }
    if (output.stdout.length > 0) {
        console.log(output.stdout);
        return true;
    }
    return false;
}