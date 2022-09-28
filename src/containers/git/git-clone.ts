import { PathLike } from 'fs-extra';
import { GitProgressEvent } from 'isomorphic-git';
import { execute } from '../utils';

// TODO: Clean-up the onProgress indicator for `cloneRepo` below. Also add JSDoc comments.

export const cloneRepo = async ({
    dir, repo, branch, bare, singleBranch, noCheckout, onProgress
}: {
    repo: URL | PathLike;
    dir: PathLike;
    branch?: string;
    bare?: boolean;
    singleBranch?: boolean;
    noCheckout?: boolean;
    onProgress?: (progress: GitProgressEvent) => void | Promise<void> | undefined;
}): Promise<boolean> => {
    const bareOption = bare ? `--bare` : '';
    const noCheckoutOption = noCheckout ? `--no-checkout` : '';
    const singleBranchOption = singleBranch ? `--single-branch` : '';
    const branchOption = branch ? `--branch ${branch}` : '';
    const output = await execute(`git clone ${repo.toString()} ${dir.toString()} ${branchOption} ${bareOption} ${noCheckoutOption} ${singleBranchOption}`, dir.toString());

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