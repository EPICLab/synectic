import { PathLike } from 'fs-extra';
import { Branch } from '../../store/slices/branches';
import { Expand, WithRequired, isDefined, removeUndefined } from '../utils';
import { execute } from '../exec';
import { getRemote } from './git-remote';

type BranchOutput = Expand<WithRequired<Partial<Omit<Branch, 'id'>>, 'ref'>>;

/**
 * Show branches and their commits.
 *
 * @param obj - A destructured object for named properties.
 * @param obj.dir - The worktree root directory.
 * @param obj.all - Show both remote-tracking branches and local branches.
 * @param obj.remotes - Show the remote-tracking branches.
 * @param obj.list - Usually the command stops output upon showing the commit that is the common ancestor
 * of all the branches. This flag tells the command to display only the references given, without showing
 * the commit ancestory tree.
 * @returns {Promise<ReturnType<typeof processShowBranchOutput>>} A Promise object containing an array of
 * {@link BranchOutput} objects representing tracked branches.
 */
export const showBranch = async ({
  dir,
  all = false,
  remotes = false,
  list = true
}: {
  dir: PathLike;
  all?: boolean;
  remotes?: boolean;
  list?: boolean;
}): Promise<ReturnType<typeof processShowBranchOutput>> => {
  const options = removeUndefined([
    all ? '--all' : undefined,
    remotes ? '--remotes' : undefined,
    list ? '--list' : undefined
  ]).join(' ');

  const output = await execute(`git show-branch ${options}`, dir.toString());
  const remoteNames = (await getRemote({ dir: dir })).map(r => r.remote);
  if (output.stderr.length > 0) console.error(output.stderr);
  return processShowBranchOutput(output.stdout, remoteNames);
};

export const processShowBranchOutput = (output: string, remotes: string[]): BranchOutput[] => {
  const result: BranchOutput[] = output
    .split(/\r?\n/)
    .map(line => {
      /**
       * Regex pattern matches with the following capture groups:
       * [1] type of branch (`*` indicates current branch in the `dir` directory, otherwise `<empty>` for all other tracked branches)
       * [2] remote repository alias (i.e. only present if ref is for a remote branch; typically set to `origin`)
       * [3] branch ref (e.g. `master` or `feature/perf-improvements`)
       */
      const linePattern = new RegExp(
        `^(?:(\\*)|(?: )) \\[(?:(${remotes.join('|')})/)?(.*)\\]`,
        'g'
      );

      const lineResult = linePattern.exec(line);
      const scope: 'local' | 'remote' = lineResult?.[2] ? 'remote' : 'local';
      const remote = lineResult?.[2] ?? 'origin';
      const ref = lineResult?.[3];
      return ref ? { ref: ref, scope: scope, remote: remote } : undefined;
    })
    .filter(isDefined);
  return result;
};
