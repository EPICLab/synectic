import { PathLike } from 'fs-extra';
import execute from '../exec';
import { SHA1 } from '../../store/types';

type ResetMode = 'soft' | 'hard' | 'mixed' | 'merge' | 'keep';

/**
 * Reset current HEAD reference to point to a specified state; i.e. undo a set of changes
 * indicated by commits at the head of a branch and reset the branch to point to the
 * target `commit`.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.mode - Optional mode for determining the `git-reset` operation.
 * @param obj.commit - The SHA1 commit hash or branch name to reset file objects back to.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the file
 * content and branch references were successfully reset.
 */
export const reset = async ({
  dir,
  mode = 'mixed',
  commit
}: {
  dir: PathLike;
  mode?: ResetMode;
  commit: SHA1;
}): Promise<boolean> => {
  const output = await execute({
    command: 'git',
    args: ['reset', `--${mode}`, commit.toString()],
    cwd: dir.toString()
  });
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }
  if (output.stdout) console.log(output.stdout);
  return true;
};
