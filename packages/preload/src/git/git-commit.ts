import type {PathLike} from 'fs-extra';
import {execute} from '../io';
import {revParse} from './git-rev-parse';

/**
 * Record changes to the repository. Create a new commit containing the current contents of the
 * index and the given log message describing the changes. The new commit is a direct child of
 * HEAD, usually the tip of the current branch, and the branch is updated to point to it (unless
 * no branch is associated with the working tree, in which case HEAD is "detached" as described
 * in {@linkcode checkoutDetached}.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.message - The commit message.
 * @returns {Promise<string | undefined>} A Promise object containing the SHA-1 hash of the new
 * commit, or undefined if no commit was created.
 */
export const commit = async ({
  dir,
  message,
}: {
  dir: PathLike;
  message?: string;
}): Promise<string | undefined> => {
  const refPattern = new RegExp('\\[\\w+ (\\w+)\\]', 'g');
  const output = await execute({
    command: 'git',
    args: ['commit', message ? `-m "${message}"` : ''],
    cwd: dir.toString(),
  });

  if (output.stderr) {
    console.error(output.stderr);
    return undefined;
  }
  const sha1 = refPattern.exec(output.stdout ?? '')?.[1];
  return sha1 ? await revParse({dir: dir, args: [sha1]}) : undefined;
};
