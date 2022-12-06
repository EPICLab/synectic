import * as path from 'path';
import { SHA1 } from '../../store/types';
import { execute, getConflictingChunks, ProgressCallback, removeUndefinedProperties } from '../utils'
import { worktreeList } from './git-worktree';
import { pathExists, PathLike } from 'fs-extra';
import { getBranchRoot, getWorktreePaths } from './git-path';
import { isDirectory, isEqualPaths, readFileAsync } from '../io';
import { getIgnore } from './git-ignore';
import { listBranch } from './git-branch';
import { VersionedMetafile } from '../../store/slices/metafiles';

export type Conflict = Pick<VersionedMetafile, 'path' | 'conflicts'>;

export type MergeOutput = {
    alreadyMerged: boolean;
    fastForward: boolean;
    mergeCommit?: SHA1;
    conflicts?: PathLike[];
}

/**
 * Incorporate changes from the named commits (since the time their histories diverged from the current branch) into the
 * current branch. This command is used by `git pull` to incorporate changes from another repository and can be used by
 * hand to merge changes from one branch into another.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory.
 * @param obj.squash - Optional flag to produce the working tree and index state as if a real merge happened (except for the 
 * merge information), but do not actually make a commit, move the HEAD, or record `@GIT_DIR/MERGE_HEAD` (to cause the next
 * `git commit` command to create a merge commit). This allows you to create a single commit on top of the current branch whose
 * effect is the same as merging another branch (or more in case of an octopus). Defaults to `false`.
 * @param obj.fastForwardOnly - Optional flag to resolve the merge as a fast-forward when possible. When not possible, refuse
 * to merge and exit with a non-zero status. Defaults to `false`.
 * @param obj.verify - Optional flag to allow the *pre-merge* and *commit-msg* hooks to run. Defaults to `true`.
 * @param obj.quiet - Optional flag to operate quietly. Defaults to `false`.
 * @param obj.base - Optional alternate base branch name to specify linked worktrees.
 * @param obj.commitish - The SHA1 commit hash or branch name to merge into our branch.
 * @param obj.message - Set the commit message to be used for the merge commit (in case one is created).
 * @param obj.onProgress - Callback for listening to intermediate progress events during the merge.
 * @returns {Promise<MergeOutput>} A Promise object containing a {@link MergeOutput} object representing the
 * results of the merge.
 */
export const mergeBranch = async ({
    dir, squash = false, fastForwardOnly = false, verify = true, quiet = false, base, commitish, message, onProgress
}: {
    dir: PathLike;
    squash?: boolean;
    fastForwardOnly?: boolean;
    verify?: boolean;
    quiet?: boolean;
    base?: string;
    commitish: string;
    message?: string;
    onProgress?: ProgressCallback
}): Promise<MergeOutput> => {
    // TODO: false should be returned when `fastForwardOnly` is enabled and output is `fatal: Not possible to fast-forward, aborting.`
    const conflictPattern = new RegExp('(?<=Merge conflict in ).*(?=\\r?\\n)', 'gm');

    const baseBranch = base ? (await worktreeList({ dir: dir })).find(w => w.ref === base) : undefined;
    const root = baseBranch?.root ? baseBranch.root : dir;

    if (onProgress) await onProgress({ phase: `Merging '${commitish}' in ${root.toString()}`, loaded: 0, total: 2 });
    const output = await execute(`git merge ${squash ? '--squash' : ''} ${quiet ? '--quiet' : ''} ${!verify ? '--no-verify' : ''} ` +
        `${fastForwardOnly ? '--ff-only' : ''} ${commitish} ${message ? `-m ${message}` : ''}`, root.toString());
    const conflicts = output.stdout.match(conflictPattern)?.map(filepath => path.resolve(root.toString(), filepath));

    if (output.stderr.length > 0) {
        if (onProgress) await onProgress({ phase: output.stderr, loaded: 1, total: 2 });
        console.error(output.stderr);
    }
    if (output.stdout.length > 0) {
        if (onProgress) await onProgress({ phase: output.stdout, loaded: 2, total: 2 });
        console.log(output.stdout);
    }
    return {
        alreadyMerged: false,
        fastForward: false,
        ...removeUndefinedProperties({ conflicts: conflicts })
    };
}

export const mergeInProgress = async ({
    dir,
    action
}: {
    dir: PathLike;
    action: 'continue' | 'abort' | 'quit';
}) => {
    const output = await execute(`git merge --${action}`, dir.toString());
    // TODO: false should be returned when the output is `fatal: There is no merge in progress (MERGE_HEAD missing).`
    // TODO: false should be returned when the output is `fatal: There is no merge to abort (MERGE_HEAD missing).`
    // TODO: false should be returned when `quit` is used, but there is no MERGE_HEAD (although no output is shown typically).
    if (output.stderr.length > 0) {
        console.error(output.stderr);
        return false;
    }
    if (output.stdout.length > 0) console.log(output.stdout);
    return true;
}


/**
 * Check for conflicting chunks within a specific directory or file.
 * 
 * @param filepath - The relative or absolute path to evaluate.
 * @returns {Promise<Conflict[]>} A Promise object containing an array of conflict information found in the specified
 * file or directory (the array does not include entries for non-conflicting files).
 */
export const checkUnmergedPath = async (filepath: PathLike): Promise<Conflict[]> => {
    const isDir = await isDirectory(filepath);
    return isDir ? await checkUnmergedDirectory(filepath) : await checkUnmergedFile(filepath);
}


const checkUnmergedFile = async (filepath: PathLike): Promise<Conflict[]> => {
    const { dir, worktreeDir } = await getWorktreePaths(filepath);
    if (!dir) return [];

    const ignore = worktreeDir ? (await getIgnore(worktreeDir, true)) : (await getIgnore(dir, true));
    const relativePath = worktreeDir
        ? path.relative(worktreeDir.toString(), filepath.toString())
        : path.relative(dir.toString(), filepath.toString());
    if (ignore.ignores(relativePath)) return [];

    const content = await readFileAsync(filepath, { encoding: 'utf-8' });
    const conflicts = getConflictingChunks(content);
    if (conflicts.length == 0) return [];

    return [{ path: filepath, conflicts: conflicts }];
}

const checkUnmergedDirectory = async (directory: PathLike): Promise<Conflict[]> => {
    const result = await execute(`git diff --check`, directory.toString());

    const conflictPattern = /(.+?)(?<=:)(\d)*(?=:)/gm; // Matches `<filename>:<position>` syntax, with a `:` positive lookbehind.
    const conflictedFiles = new Map<string, number[]>();
    result.stdout.match(conflictPattern)?.forEach(match => {
        const [filename, position] = match.split(':').slice(0, 2) as [string, number];
        const filepath = path.join(directory.toString(), filename);
        const existing = conflictedFiles.get(filepath);
        conflictedFiles.set(filepath, existing ? [...existing, position] : [position]);
    });
    return Array.from(conflictedFiles).map(c => ({ path: c[0], conflicts: c[1] }));
}

/**
 * Check for conflicts in a base branch after attempting to merge.
 *
 * @param dir The root directory of either the main worktree or linked worktree.
 * @param branch The name of the branch to check against (i.e. the base branch).
 * @returns {Promise<Conflict[]>} A Promise object containing an array of conflict information found in the specified branch.
 */
export const checkUnmergedBranch = async (dir: PathLike, branch: string): Promise<Conflict[]> => {
    const branchRoot = await getBranchRoot(dir, branch);
    const worktree = await getWorktreePaths(dir);
    const current = (await listBranch({ dir: dir, showCurrent: true }))[0]?.ref;
    // skip any locally-tracked branches that are not checked out in the main worktree directory
    const trackedLocalBranch = (branchRoot && worktree.dir) ? isEqualPaths(branchRoot, worktree.dir) && branch !== current : false;
    if (!branchRoot || trackedLocalBranch) return [];

    const result = await execute(`git diff --check`, branchRoot.toString());

    const conflictPattern = /(.+?)(?<=:)(\d)*(?=:)/gm; // Matches `<filename>:<position>` syntax, with a `:` positive lookbehind.
    const conflictedFiles = new Map<string, number[]>();
    result.stdout.match(conflictPattern)?.forEach(match => {
        const [filename, position] = match.split(':').slice(0, 2) as [string, number];
        const filepath = path.join(branchRoot.toString(), filename);
        const existing = conflictedFiles.get(filepath);
        conflictedFiles.set(filepath, existing ? [...existing, position] : [position]);
    });
    return Array.from(conflictedFiles).map(c => ({ path: c[0], conflicts: c[1] }));
}

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
 *
 * @param root The root directory of the base branch involved in the merge; either a main or linked worktree path can be resolved.
 * @returns {Promise<{ base: string | undefined; compare: string | undefined; }>} A Promise object containing the base branch name (or 
 * undefined if not included in the `MERGE_MSG` file) and the compare branch name.
 */
export const fetchMergingBranches = async (root: PathLike): Promise<{ base: string | undefined, compare: string | undefined }> => {
    const branchPattern = /(?<=Merge( remote-tracking)? branch(es)? .*)('.+?')+/gm; // Match linked worktree and main worktree patterns
    const { gitdir, worktreeLink } = await getWorktreePaths(root);
    const mergeMsg = worktreeLink ? path.join(worktreeLink.toString(), 'MERGE_MSG') : gitdir ? path.join(gitdir.toString(), 'MERGE_MSG') : '';
    const message = (await pathExists(mergeMsg)) ? await readFileAsync(mergeMsg, { encoding: 'utf-8' }) : '';
    const match = message.match(branchPattern);
    return match
        ? match.length === 2
            ? { base: (match[0] as string).replace(/['"]+/g, ''), compare: (match[1] as string).replace(/['"]+/g, '') }
            : { base: undefined, compare: (match[0] as string).replace(/['"]+/g, '') }
        : { base: undefined, compare: undefined };
};