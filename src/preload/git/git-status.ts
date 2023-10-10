import { pathExists } from 'fs-extra';
import { join, relative, resolve, sep } from 'path';
import { execute, isDirectory, isEqualPaths } from '../io';
import { getIgnore } from './git-ignore';
import { getRoot, getWorktreePaths } from './git-path';
import { BranchStatus, GitStatus, PathLike } from 'types/app';

type StatusOutput = {
  ref: string;
  root: PathLike;
  status: BranchStatus;
  bare: boolean;
  entries: { path: PathLike; status: GitStatus }[];
};

/**
 * Show the working tree status. This command displays paths that have differences between the
 * index file and the current HEAD commit, paths that have differences between the working tree and
 * the index file, and paths in the working tree that are not tracked by *git* (and are not ignored
 * by `git-ignore`).
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.pathspec - Pattern used to limit paths in *git* commands. See additional documentation:
 * {@link https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec pathspec}.
 * @param obj.ignored - Optional flag to include ignored files in the output; defaults to false.
 * @returns {Promise<StatusOutput | undefined>} A Promise object containing a {@link StatusOutput}
 * object with branch status information, or `undefined` if not contained within a directory
 * tracked by version control.
 */
export const worktreeStatus = async ({
  dir,
  pathspec,
  ignored = false
}: {
  dir: PathLike;
  pathspec?: PathLike | string;
  ignored?: boolean;
}): Promise<StatusOutput | undefined> => {
  /**
   * Regex pattern matches with the following capture groups:
   * [1] base branch ref (e.g. `main` from `## main`)
   * [2] optional compare branch ref (e.g. `origin/main` from `## main...origin/main`)
   */
  const branchesPattern = new RegExp('^## (.+?)(?:(?:\\.\\.\\.)(.+?))?$', 'gm');
  /**
   * Regex pattern matches with the following capture groups:
   * [1] status code (e.g. ` M` or `DD`)
   * [2] relative filepath from root path (e.g. `src/component/Dialog`)
   */
  const entriesPattern = new RegExp('(?<=\\r?\\n)(.{2}) (.*)', 'gm');
  const root = await getRoot(dir);
  if (!root) return undefined;
  const ignore = await getIgnore(root);

  const output = await execute({
    command: 'git',
    args: [
      'status',
      '--porcelain',
      '--branch',
      ignored ? '--ignored' : '',
      pathspec?.toString() ?? ''
    ],
    cwd: dir.toString()
  });

  const ref = output.stdout ? branchesPattern.exec(output.stdout)?.[1] : undefined;
  const parentEntries: { path: PathLike; status: GitStatus }[] = [];
  const entries: { path: PathLike; status: GitStatus }[] = Array.from(
    output.stdout?.matchAll(entriesPattern) ?? []
  )
    .map(e => {
      const filepath = e[2] as string;
      const isIgnored = ignore.ignores(filepath);
      // if git-status returns a filepath that includes parent directories
      // (e.g. `lib/sample/example.ts`), then each parent must be updated
      if (filepath.includes(sep)) {
        const parentNames = filepath.split(sep).slice(0, -1);
        const parents = parentNames.map((name, index) =>
          parentNames.slice(0, index).concat(name).join(sep)
        );

        parents.map(parent => {
          const parentPath = resolve(root.toString(), parent);
          if (
            !parentEntries.find(entry => isEqualPaths(entry.path, parentPath)) &&
            !isEqualPaths(parentPath, resolve(root.toString(), filepath))
          ) {
            parentEntries.push({
              path: parentPath,
              status: isIgnored ? 'ignored' : processStatusCode(e[1])
            });
          }
        });
      }
      return {
        path: resolve(root.toString(), filepath),
        status: isIgnored ? 'ignored' : processStatusCode(e[1])
      };
    })
    .concat(parentEntries);
  const worktreePaths = await getWorktreePaths(root);
  const mergingHead = worktreePaths.worktreeLink
    ? await pathExists(join(worktreePaths.worktreeLink.toString(), 'MERGE_HEAD'))
    : false; // check for an in-progress merge
  const status: BranchStatus =
    entries.find(e => e.status === 'unmerged') || mergingHead
      ? 'unmerged'
      : entries.length == 0
      ? 'clean'
      : entries.every(e => e.status.startsWith('*') || e.status === 'absent')
      ? 'unstaged'
      : 'uncommitted';
  if (output.stderr) console.error(output.stderr);

  return {
    ref: ref ? ref : '',
    root: dir,
    status: status,
    bare: ref ? false : true,
    entries: entries
  };
};

/**
 * Show the git status for a specific file in the working tree. This is a convenience command for
 * examining individual files and directories using the output from {@link worktreeStatus}. In the
 * case of a directory, the resulting status is limited to indicating whether the directory is
 * `ignored`, `unmodified`, `*modified`, `modified`, or `unmerged`.
 * @param filepath - The relative or absolute path to evaluate.
 * @returns {Promise<GitStatus>} A Promise object containing the {@link GitStatus} for an
 * individual filepath.
 */
export const fileStatus = async (filepath: PathLike): Promise<GitStatus | undefined> => {
  const root = await getRoot(filepath);
  if (!root) {
    console.error('git-status error: no .git exists within parent directories');
    return undefined;
  }
  const branchStatus = await worktreeStatus({ dir: root.toString(), pathspec: filepath });
  if (!branchStatus) {
    console.error('git-status error: path not contained in a directory tracked by version control');
    return undefined;
  }
  const isDir = await isDirectory(filepath);
  if (isDir) {
    const isIgnored = isEqualPaths(root, filepath)
      ? false
      : (await getIgnore(root)).ignores(relative(root.toString(), filepath.toString()));
    if (isIgnored) return 'ignored';

    /**
     * git-status might specify status for directories when unstaging using `git-restore` (e.g.
     * unstaging a directory that is not currently tracked by git results in `added` instead of
     * `*modified` status)
     */
    const specifiedStatus = branchStatus.entries.find(e =>
      isEqualPaths(e.path, resolve(root.toString(), filepath.toString()))
    )?.status;
    if (specifiedStatus) return specifiedStatus;

    switch (branchStatus.status) {
      case 'clean':
        return 'unmodified';
      case 'unstaged':
        return '*modified';
      case 'uncommitted':
        return 'modified';
      case 'unmerged':
        return 'unmerged';
    }
  } else {
    return (
      branchStatus.entries.find(e =>
        isEqualPaths(e.path, resolve(root.toString(), filepath.toString()))
      )?.status ?? 'unmodified'
    );
  }
};

/**
 * Convert 2-digit status code to a {@link GitStatus} value, input format per
 * https://git-scm.com/docs/git-status#_short_format:
 *
 * | X        |     Y    |  Meaning                              |
 * | -------- | -------- | ------------------------------------- |
 * |          | [AMD]    | not updated                           |
 * | M        | [ MTD]   | updated in index                      |
 * | T        | [ MTD]   | type changed in index                 |
 * | A        | [ MTD]   | added to index                        |
 * | D        |          | deleted from index                    |
 * | R        | [ MTD]   | renamed in index                      |
 * | C        | [ MTD]   | copied in index                       |
 * | [MTARC]  |          | index and work tree matches           |
 * | [ MTARC] | M        | work tree changed since index         |
 * | [ MTARC] | T        | type changed in work tree since index |
 * | [ MTARC] | D        | deleted in work tree                  |
 * |          | R        | renamed in work tree                  |
 * |          | C        | copied in work tree                   |
 * | D        | D        | unmerged, both deleted                |
 * | A        | U        | unmerged, added by us                 |
 * | U        | D        | unmerged, deleted by them             |
 * | U        | A        | unmerged, added by them               |
 * | D        | U        | unmerged, deleted by us               |
 * | A        | A        | unmerged, both added                  |
 * | U        | U        | unmerged, both modified               |
 * | ?        | ?        | untracked                             |
 * | !        | !        | ignored                               |
 * @param statusCode - A 2-digit status code from `git status --short`
 * @returns {GitStatus} An enumerated git status value.
 */
export const processStatusCode = (statusCode: string | undefined): GitStatus => {
  if (!statusCode) return 'unmodified';
  if (statusCode == '!!') return 'ignored'; // git-ignore rules exclude this filepath
  if (statusCode == '??') return 'absent'; // untracked path; not present in index or working tree
  if (/(DD|AA|.U|U.)/.test(statusCode)) return 'unmerged'; // unmerged; merge conflict has occurred and has not yet been resolved
  if (/M(?=[ MTD])/.test(statusCode)) return 'modified';
  if (/(?=[ MTD])M/.test(statusCode)) return '*modified';
  if (/A(?=[ MTD])/.test(statusCode)) return 'added';
  if (/(?=[ MTD])A/.test(statusCode)) return '*added';
  if (/D(?=[ MTD])/.test(statusCode)) return 'deleted';
  if (/(?=[ MTD])D/.test(statusCode)) return '*deleted';

  console.error(`Unable to convert '${statusCode}' status code`);
  return 'unmodified';
};
