import { PathLike } from 'fs-extra';
import { execute } from '../exec';
import { getWorktreePaths } from './git-path';

/**
 * Restore specified paths in the working tree with some contents from a restore source. If a path is tracked but does not exist in the
 * restore source, it will be removed to match the source.
 *
 * The command can also be used to restore the content in the index with `staged` option enabled, or restore both the working tree and
 * the index with the `staged` and `worktree` options both enabled.
 *
 * By default, if `staged` is enabled, the contents are restored from HEAD, otherwise from the index.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.filepath - The relative or absolute path to restore.
 * @param obj.staged - Optional flag to restore the content in the index.
 * @param obj.worktree - Optional flag to restore the working tree; default is true when both `worktree` and `staged` are not used.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the file content was successfully restored.
 */
export const restore = async ({
  filepath,
  staged = false,
  worktree = false
}: {
  filepath: PathLike;
  staged?: boolean;
  worktree?: boolean;
}): Promise<boolean> => {
  const { dir, worktreeDir } = await getWorktreePaths(filepath);
  if (!dir) return false; // not under version control

  const root = worktreeDir ? worktreeDir : dir;

  const output = await execute(
    `git restore ${staged ? '--staged' : ''} ${worktree ? '-worktree' : ''} ${filepath.toString()}`,
    root.toString()
  );
  if (output.stderr.length > 0) {
    console.error(output.stderr);
    return false;
  }
  if (output.stdout.length > 0) console.log(output.stdout);
  return true;
};
