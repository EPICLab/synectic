import {type PathLike, pathExists} from 'fs-extra';
import {join, relative, resolve} from 'path';
import {execute, isDirectory, isEqualPaths, readFileAsync} from '../io';
import {getConflictingChunks, removeNullableProperties} from '../utils';
import {getIgnore} from './git-ignore';
import {log} from './git-log';
import {getBranchRoot, getWorktreePaths} from './git-path';
import {revList} from './git-rev-list';
import {revParse} from './git-rev-parse';
import {worktreeList} from './git-worktree';
import type {VersionedMetafile} from '@syn-types/metafile';
import type {ProgressCallback} from '@syn-types/util';
import type {MergeOutput} from '@syn-types/app';

export type Conflict = Pick<VersionedMetafile, 'path' | 'conflicts'>;
export type MergeAction = 'continue' | 'abort' | 'quit';

/**
 * Incorporate changes from the named commits (since the time their histories diverged from the
 * current branch) into the current branch. This command is used by `git pull` to incorporate
 * changes from another repository and can be used by hand to merge changes from one branch into
 * another.
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.squash - Optional flag to produce the working tree and index state as if a real merge
 * happened (except for the merge information), but do not actually make a commit, move the HEAD,
 * or record `@GIT_DIR/MERGE_HEAD` (to cause the next `git commit` command to create a merge
 * commit). This allows you to create a single commit on top of the current branch whose effect is
 * the same as merging another branch (or more in case of an octopus). Defaults to `false`.
 * @param obj.fastForwardOnly - Optional flag to resolve the merge as a fast-forward when possible.
 * When not possible, refuse to merge and exit with a non-zero status. Defaults to `false`.
 * @param obj.verify - Optional flag to allow the *pre-merge* and *commit-msg* hooks to run.
 * Defaults to `true`.
 * @param obj.quiet - Optional flag to operate quietly. Defaults to `false`.
 * @param obj.base - Optional alternate base branch name to specify linked worktrees.
 * @param obj.commitish - The SHA1 commit hash or branch name to merge into our branch.
 * @param obj.message - Set the commit message to be used for the merge commit (in case one is
 * created).
 * @param obj.onProgress - Callback for listening to intermediate progress events during the merge.
 * @returns {Promise<MergeOutput>} A Promise object containing a {@link MergeOutput} object
 * representing the results of the merge.
 */
export const mergeBranch = async ({
  dir,
  squash = false,
  fastForwardOnly = false,
  verify = true,
  quiet = false,
  base,
  commitish,
  message,
  onProgress,
}: {
  dir: PathLike;
  squash?: boolean;
  fastForwardOnly?: boolean;
  verify?: boolean;
  quiet?: boolean;
  base?: string;
  commitish: string;
  message?: string;
  onProgress?: ProgressCallback;
}): Promise<MergeOutput> => {
  const baseBranch = base ? (await worktreeList({dir: dir})).find(w => w.ref === base) : undefined;
  const root = baseBranch?.root ? baseBranch.root : dir;

  if (!quiet && onProgress && baseBranch) {
    const commits = (
      await revList({dir: root, commitish: [baseBranch.ref, '^' + commitish]})
    ).split(/\r?\n/);
    await Promise.all(
      commits.map(
        async (commit, idx) =>
          await onProgress({
            phase: `Merging commit '${commit}' into '${baseBranch.ref}' branch`,
            loaded: idx,
            total: commits.length,
          }),
      ),
    );
  }
  const output = await execute({
    command: 'git',
    args: [
      'merge',
      squash ? '--squash' : '',
      quiet ? '--quiet' : '',
      !verify ? '--no-verify' : '',
      fastForwardOnly ? '--ff-only' : '',
      commitish,
      message ? `-m ${message}` : '',
    ],
    cwd: root.toString(),
  });

  if (!quiet && output.stderr) {
    if (onProgress) await onProgress({phase: output.stderr, loaded: 1, total: 1});
    console.error(output.stderr);
  }
  if (!quiet && output.stdout) {
    if (onProgress) await onProgress({phase: output.stdout, loaded: 1, total: 1});
    console.log(output.stdout);
  }

  return await processMergeOutput(output, root);
};

export const mergeInProgress = async ({dir, action}: {dir: PathLike; action: MergeAction}) => {
  const output = await execute({
    command: 'git',
    args: ['merge', `--${action}`],
    cwd: dir.toString(),
  });
  // TODO: false should be returned when the output is `fatal: There is no merge in progress (MERGE_HEAD missing).`
  // TODO: false should be returned when the output is `fatal: There is no merge to abort (MERGE_HEAD missing).`
  // TODO: false should be returned when `quit` is used, but there is no MERGE_HEAD (although no output is shown typically).
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }
  if (output.stdout) console.log(output.stdout);
  return true;
};

/**
 * Check for conflicting chunks within a specific directory or file.
 * @param filepath - The relative or absolute path to evaluate.
 * @returns {Promise<Conflict[]>} A Promise object containing an array of conflict information
 * found in the specified file or directory (the array does not include entries for
 * non-conflicting files).
 */
export const checkUnmergedPath = async (filepath: string): Promise<Conflict[]> => {
  const isDir = await isDirectory(filepath);
  return isDir ? await checkUnmergedDirectory(filepath) : await checkUnmergedFile(filepath);
};

const checkUnmergedFile = async (filepath: string): Promise<Conflict[]> => {
  const {dir, worktreeDir} = await getWorktreePaths(filepath);
  if (!dir) return [];

  const ignore = worktreeDir ? await getIgnore(worktreeDir, true) : await getIgnore(dir, true);
  const relativePath = worktreeDir
    ? relative(worktreeDir.toString(), filepath.toString())
    : relative(dir.toString(), filepath.toString());
  if (ignore.ignores(relativePath)) return [];

  const content = (await readFileAsync(filepath, {encoding: 'utf-8'})).toString();
  const conflicts = getConflictingChunks(content);
  if (conflicts.length == 0) return [];

  return [{path: filepath, conflicts: conflicts}];
};

const checkUnmergedDirectory = async (directory: PathLike): Promise<Conflict[]> => {
  const result = await execute({
    command: 'git',
    args: ['diff', '--check'],
    cwd: directory.toString(),
  });

  const conflictPattern = /(.+?)(?<=:)(\d)*(?=:)/gm; // Matches `<filename>:<position>` syntax, with a `:` positive lookbehind.
  const conflictedFiles = new Map<string, number[]>();
  result.stdout?.match(conflictPattern)?.forEach(match => {
    const [filename, position] = match.split(':').slice(0, 2) as [string, number];
    const filepath = join(directory.toString(), filename);
    const existing = conflictedFiles.get(filepath);
    conflictedFiles.set(filepath, existing ? [...existing, position] : [position]);
  });
  return Array.from(conflictedFiles).map(c => ({path: c[0], conflicts: c[1]}));
};

/**
 * Check for conflicts in a base branch after attempting to merge.
 * @param dir The root directory of either the main worktree or linked worktree.
 * @param branch The name of the branch to check against (i.e. the base branch).
 * @returns {Promise<Conflict[]>} A Promise object containing an array of conflict information found in the specified branch.
 */
export const checkUnmergedBranch = async (dir: string, branch: string): Promise<Conflict[]> => {
  const branchRoot = await getBranchRoot(dir, branch);
  const worktree = await getWorktreePaths(dir);
  const current = await revParse({dir: dir, opts: ['abbrevRef'], args: ['HEAD']});
  // skip any locally-tracked branches that are not checked out in the main worktree directory
  const trackedLocalBranch =
    branchRoot && worktree.dir
      ? isEqualPaths(branchRoot, worktree.dir) && branch !== current
      : false;
  if (!branchRoot || trackedLocalBranch) return [];

  const result = await execute({
    command: 'git',
    args: ['diff', '--check'],
    cwd: branchRoot.toString(),
  });

  const conflictPattern = /(.+?)(?<=:)(\d)*(?=:)/gm; // Matches `<filename>:<position>` syntax, with a `:` positive lookbehind.
  const conflictedFiles = new Map<string, number[]>();
  result.stdout?.match(conflictPattern)?.forEach(match => {
    const [filename, position] = match.split(':').slice(0, 2) as [string, number];
    const filepath = join(branchRoot.toString(), filename);
    const existing = conflictedFiles.get(filepath);
    conflictedFiles.set(filepath, existing ? [...existing, position] : [position]);
  });
  return Array.from(conflictedFiles).map(c => ({path: c[0], conflicts: c[1]}));
};

/**
 * Resolve the names of branches involved in an in-progress merge, given the root directory path of the base branch. If the base branch is a
 * linked worktree, then this function will extract the branch names from the `GIT_DIR/worktrees/{branch}/MERGE_MSG` file which has
 * content similar to:
 * ```bash
 * Merge remote-tracking branch 'origin/compare' into base
 *
 * # Conflicts:
 * #	components/list/index.tsx
 * ```
 *
 * If the base branch is located in the main worktree directory, then we extract the branch names from the GIT_DIR/MERGE_MSG file which has
 * content similar to:
 * ```bash
 * Merge branch 'compare'
 *
 * # Conflicts:
 * #	components/list/index.tsx
 * ```
 * @param root The root directory of the base branch involved in the merge; either a main or linked worktree path can be resolved.
 * @returns {Promise<{ base: string | undefined; compare: string | undefined; }>} A Promise object containing the base branch name (or
 * undefined if not included in the `MERGE_MSG` file) and the compare branch name.
 */

export const fetchMergingBranches = async (
  root: string,
): Promise<{base: string | undefined; compare: string | undefined}> => {
  const branchPattern = /(?<=Merge( remote-tracking)? branch(es)? .*)('.+?')+/gm; // Match linked worktree and main worktree patterns
  const {gitdir, worktreeLink} = await getWorktreePaths(root);
  const mergeMsg = worktreeLink
    ? join(worktreeLink.toString(), 'MERGE_MSG')
    : gitdir
    ? join(gitdir.toString(), 'MERGE_MSG')
    : '';
  const message = (await pathExists(mergeMsg))
    ? (await readFileAsync(mergeMsg, {encoding: 'utf-8'})).toString()
    : '';
  const match = message.match(branchPattern);
  return match
    ? match.length === 2
      ? {
          base: (match[0] as string).replace(/['"]+/g, ''),
          compare: (match[1] as string).replace(/['"]+/g, ''),
        }
      : {base: undefined, compare: (match[0] as string).replace(/['"]+/g, '')}
    : {base: undefined, compare: undefined};
};

export const processMergeOutput = async (
  output: Awaited<ReturnType<typeof execute>>,
  root: PathLike,
): Promise<MergeOutput> => {
  const failedPattern = new RegExp('(fatal|error):', 'gm');
  const alreadyMergedPattern = new RegExp('Already up to date.', 'gm');
  const conflictPattern = new RegExp('(?<=Merge conflict in ).*(?=\\r?\\n)', 'gm');
  const fastForwardPattern = new RegExp('(?<!fatal.*)Fast-forward', 'gim');
  const mergeStrategyPattern = new RegExp("Merge made by the '(.*)' strategy.", 'gm');
  const rebasePattern = new RegExp('Successfully rebased and updated', 'gm');

  const alreadyMerged = output.stdout?.match(alreadyMergedPattern) ? true : false;
  const fastForward = output.stdout?.match(fastForwardPattern) ? true : false;
  const conflicts = output.stdout
    ?.match(conflictPattern)
    ?.map(filepath => resolve(root.toString(), filepath));
  const rebaseStrategy = output.stdout?.match(rebasePattern) ? true : false;
  const mergeStrategy = output.stdout ? mergeStrategyPattern.exec(output.stdout)?.[1] : undefined;
  const mergeCommit = mergeStrategy ? (await log({dir: root}))[0]?.oid : undefined;
  const failed = output.stderr?.match(failedPattern) ? true : false;

  const mergeOutput: MergeOutput = {
    status: failed || (conflicts && conflicts.length > 0) ? 'Failing' : 'Passing',
    alreadyMerged: alreadyMerged,
    fastForward: fastForward,
    output: failed ? output.stderr ?? '' : output.stdout ?? '',
    ...removeNullableProperties({
      mergeCommit: mergeCommit,
      mergeStrategy: rebaseStrategy ? 'rebase' : mergeStrategy,
      conflicts: conflicts,
    }),
  };
  return mergeOutput;
};
