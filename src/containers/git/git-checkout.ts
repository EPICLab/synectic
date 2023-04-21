import { PathLike } from 'fs-extra';
import { Either } from '../utils';
import { execute } from '../exec';

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
  dir,
  branch,
  quiet = false,
  force = false,
  merge = false
}: {
  dir: PathLike;
  branch: string;
  quiet?: boolean;
  force?: boolean;
  merge?: boolean;
}): Promise<void> => {
  const output = await execute(
    `git checkout ${branch} ${force ? '--force' : ''} ${merge ? '--merge' : ''}`,
    dir.toString()
  );
  if (!quiet && output.stderr.length > 0) console.error(output.stderr);
};

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
  dir,
  commitish,
  quiet = false,
  force = false,
  merge = false
}: {
  dir: PathLike;
  commitish: string;
  quiet?: boolean;
  force?: boolean;
  merge?: boolean;
}): Promise<void> => {
  const output = await execute(
    `git checkout --detach ${commitish} ${force ? '--force' : ''} ${merge ? '--merge' : ''}`,
    dir.toString()
  );
  if (!quiet && output.stderr.length > 0) console.error(output.stderr);
  if (!quiet && output.stdout.length > 0) console.log(output.stdout);
};

/**
 * Overwrite the contents of the files that match the pathspec. When the <tree-ish> (most often a commit) is not given, overwrite working
 * tree with the contents in the index. When the <tree-ish> is given, overwrite both the index and the working tree with the contents at
 * the <tree-ish>.
 *
 * The index may contain unmerged entries because of a previous failed merge. By default, if you try to check out such an entry from the
 * index, the checkout operation will fail and nothing will be checked out. Using -f will ignore these unmerged entries. The contents from
 * a specific side of the merge can be checked out of the index by using --ours or --theirs. With -m, changes made to the working tree
 * file can be discarded to re-create the original conflicted merge result.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.pathspec - Pattern used to limit paths in *git* commands. See: {@link https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec}
 * @param obj.force - Ignore any unmerged entries in the index that may have been added during a previous failed merge. By default, if you
 * try to check out such an entry from the index, the checkout operation will fail and nothing will be checked out.
 * @param obj.ours - When checking out paths from the index, checkout stage #2 (ours) for unmerged paths.
 * @param obj.theirs - When checking out paths from the index, checkout stage #3 (theirs) for unmerged paths.
 * @param obj.merge - When switching branches, if you have local modifications to one or more files that are different between
 * the current branch and the branch to which you are switching, the command refuses to switch branches in order to
 * preserve your modifications in context. However, with this option, a three-way merge between the current branch,
 * your working tree contents, and the new branch is done, and you will be on the new branch.
 */
export const checkoutPathspec = async ({
  dir,
  pathspec,
  force = false,
  ours = false,
  theirs = false,
  merge = false
}: Either<
  {
    dir: PathLike;
    pathspec: string;
    force?: boolean;
    ours?: boolean;
    merge?: boolean;
  },
  {
    dir: PathLike;
    pathspec: string;
    force?: boolean;
    theirs?: boolean;
    merge?: boolean;
  }
>): Promise<boolean> => {
  const output = await execute(
    `git checkout ${force ? '--force' : ''} ${ours ? '--ours' : ''} ${theirs ? '--theirs' : ''} ${
      merge ? '--merge' : ''
    } -- ${pathspec}`,
    dir.toString()
  );
  if (output.stderr.length > 0) {
    console.error(output.stderr);
    return false;
  }
  return true;
};

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
  dir,
  newBranch,
  startPoint,
  force = false
}: {
  dir: PathLike;
  newBranch: string;
  startPoint: string;
  force?: boolean;
}): Promise<boolean> => {
  const output = await execute(
    `git checkout ${force ? '-B' : '-b'} ${newBranch} ${startPoint ? startPoint : ''}`,
    dir.toString()
  );
  if (output.stderr.length > 0) {
    console.error(output.stderr);
    return false;
  }
  return true;
};
