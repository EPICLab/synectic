import { PathLike } from 'fs-extra';
import { relative } from 'path';
import { execute } from '../exec';
import { getWorktreePaths } from './git-path';

/**
 * Add file contents to the index (aka staging area). If the filepath is tracked by a branch in a linked worktree, then index updates
 * will occur on the index file in the `GIT_DIR/worktrees/{branch}` directory.
 *
 * @param filepath The relative or absolute path to add.
 * @returns {Promise<boolean>} A Promise object containing a boolean indicating whether the file was successfully staged.
 */
export const add = async (filepath: PathLike): Promise<boolean> => {
  const { dir, worktreeDir } = await getWorktreePaths(filepath);
  if (!dir) return false; // not under version control

  const root = worktreeDir ? worktreeDir : dir;
  const relativePath = relative(root.toString(), filepath.toString());

  const output = await execute(`git add ${relativePath}`, root.toString());
  if (output.stderr.length > 0) {
    console.error(output.stderr);
    return false;
  }
  console.log(output.stdout);
  return true;
};
