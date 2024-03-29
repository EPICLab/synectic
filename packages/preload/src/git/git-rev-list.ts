import type {PathLike} from 'fs-extra';
import {execute} from '../io';

/**
 * Lists commit objects in reverse chronological order.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.commitish - The list of SHA1 commit hashes or branch names to include; or exclude if `^` is given in front of an entry.
 * @param obj.path - Restrict to only commits modifying a particular path.
 * @param obj.options - Options for limiting the commits to be returned; see https://git-scm.com/docs/git-rev-list#_options.
 * @param obj.count - Print a number stating how many commits whould have been listed, and suppress all other output.
 * @returns {string} Raw output of commit objects (or count in the case of `count` option).
 */
export const revList = async ({
  dir,
  commitish,
  path,
  options,
  count = false,
}: {
  dir: PathLike;
  commitish: string[];
  path?: PathLike;
  options?: string;
  count?: boolean;
}): Promise<string> => {
  const output = await execute({
    command: 'git',
    args: ['rev-list', count ? '--count' : '', options ?? '', ...commitish, path?.toString() ?? ''],
    cwd: dir.toString(),
  });
  if (output.stderr) console.error(output.stderr);
  return output.stdout ?? '';
};
