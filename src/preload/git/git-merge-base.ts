import type { PathLike } from 'fs-extra';
import type { SHA1 } from 'types/app';
import { execute } from '../io';
import { isDefined } from '../utils';

type MergeBaseOption = 'octopus' | 'independent' | 'isAncestor' | 'forkPoint';

/**
 * Find as good common ancestors as possible for a merge. One common ancestor is better than
 * another common ancestor if the latter is an ancestor of the former. A common ancestor that does
 * not have any better common ancestor is a best common ancestor, i.e. a merge base. Note that
 * there can be more than one merge base for a pair of commits.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.refs - The object ref(s) (e.g. commit oid or branch name) to calculate the common
 * ancestor between.
 * @param obj.all - Output all merge bases for the commits, instead of just one; defaults to
 * `false`.
 * @param obj.opt - Options for customizing the desired output; see:
 * https://git-scm.com/docs/git-merge-base.
 * @returns {Promise<string[] | undefined>} A Promise object containing an array of {@link SHA1}
 * objects representing the best common ancestor(s) between two or more commits to use in a
 * three-way merge.
 */
export const mergeBase = async ({
  dir,
  refs,
  all = false,
  opt
}: {
  dir: PathLike;
  refs: SHA1[];
  all?: boolean;
  opt?: MergeBaseOption;
}): Promise<string[] | undefined> => {
  const option = opt ? processMergeBaseOption(opt) : '';
  const output = await execute({
    command: 'git',
    args: ['merge-base', all ? '--all' : '', option, refs.join(' ')],
    cwd: dir.toString()
  });

  if (output.stderr) {
    console.error(output.stderr);
    return undefined;
  }
  return processMergeBaseOutput(output.stdout);
};

const processMergeBaseOption = (option: MergeBaseOption) => {
  switch (option) {
    case 'octopus': {
      return '--octopus';
    }
    case 'independent': {
      return '--independent';
    }
    case 'isAncestor': {
      return '--is-ancestor';
    }
    case 'forkPoint': {
      return '--fork-point';
    }
  }
};

export const processMergeBaseOutput = (output: string | undefined): string[] | undefined => {
  return isDefined(output) ? output.trim().split(/\r\n|\n/) : undefined;
};
