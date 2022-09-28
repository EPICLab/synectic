import { exec } from 'child_process';
import util from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import * as io from '../io';
import { branchLog, getIgnore, resolveRef, resolveURL } from './git-plumbing';
import { getBranchRoot, getWorktreePaths } from '../git';
import { checkout, currentBranch, getConfig } from './git-porcelain';
import { VersionedMetafile } from '../../store/slices/metafiles';
import { Ignore } from 'ignore';
import { execute, isDefined, removeUndefined } from '../utils';
import * as gitMerge from '../git/git-merge'; // eslint-disable-line @typescript-eslint/no-unused-vars

/** @deprecated */
const promiseExec = util.promisify(exec);

/** @deprecated */
export type Conflict = Pick<VersionedMetafile, 'path' | 'conflicts'>;

/** @deprecated */
type ExecError = {
    killed: boolean,
    code: number,
    signal: string | null,
    cmd: string,
    stdout: string,
    stderr: string
};

/** @deprecated */
export type MergeResult = {
    mergeStatus: isogit.MergeResult,
    mergeConflicts?: fs.PathLike[],
    stdout: string,
    stderr: string
};

/**
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link gitMerge.mergeBranch} instead.
 * Merge two branches; combining new commits from `compare` branch onto the `base` branch history. This function is a wrapper to the 
 * git* command-line utility, which differs from most git commands in Synectic that rely upon the *isomorphic-git* module. This function
 * can handle merging across linked worktrees.
 * @param dir The worktree root directory path.
 * @param base The base branch where newly merged commits should be added.
 * @param compare The compare branch for deriving mergeable commits.
 * @param onProgress X
 * @returns {Promise<MergeResult>} A Promise object containing the merge results (per https://isomorphic-git.org/docs/en/merge), 
 * exec shell-command output (`stdout` and `stderr`), and a list of files containing conflicts (if a merge conflict prevented the merge).
 */
export const merge = async (dir: fs.PathLike, base: string, compare: string, onProgress?: isogit.ProgressCallback): Promise<MergeResult> => {
    const worktree = await getWorktreePaths(dir);
    const root = worktree.worktreeDir ? worktree.worktreeDir : worktree.dir;

    if (onProgress) await onProgress({ phase: `Merging: '${compare}' into '${base}'`, loaded: 0, total: 2 });
    const commonAncestor = (await execute(`git merge-base ${base} ${compare}`, dir.toString())).stdout;
    const commitDelta = root ? await branchLog(root, base, compare, onProgress) : [];
    if (root && commitDelta.length == 0) {
        if (onProgress) await onProgress({ phase: `Already up to date: '${compare}' and '${base}' have the same commit history`, loaded: 1, total: 2 });
        const oid = worktree.dir ? await resolveRef({ dir: worktree.dir, ref: 'HEAD' }) : '';
        return {
            mergeStatus: {
                oid: oid ? oid : '',
                alreadyMerged: true,
                fastForward: false,
                mergeCommit: false
            },
            stdout: '',
            stderr: `Already up to date: '${compare}' and '${base}' have the same commit history`
        }
    }
    if (commonAncestor.length == 0) {
        if (onProgress) await onProgress({ phase: `Merge halted: '${compare}' and '${base}' have unrelated commit histories`, loaded: 1, total: 2 });
        const oid = worktree.dir ? await resolveRef({ dir: worktree.dir, ref: 'HEAD' }) : '';
        return {
            mergeStatus: {
                oid: oid ? oid : '',
                alreadyMerged: true,
                fastForward: false,
                mergeCommit: false
            },
            stdout: '',
            stderr: `Merge halted: '${compare}' and '${base}' have unrelated commit histories`
        }
    }

    const branches = await isogit.listBranches({ fs: fs, dir: dir.toString() }); // branches found locally
    const urlConfig = await getConfig({ dir: dir, keyPath: `remote.origin.url`, global: false });
    const url = urlConfig.scope !== 'none' ? resolveURL(urlConfig.value) : '';
    if (!branches.includes(base)) await checkout({ dir, ref: base, url, onProgress });
    if (!branches.includes(compare)) await checkout({ dir, ref: compare, url, onProgress });

    const branchRoot = await getBranchRoot(dir, base);
    if (!branchRoot) {
        if (onProgress) await onProgress({ phase: `Unable to locate branch root: '${base}' at ${dir.toString()}`, loaded: 1, total: 2 });
        const oid = worktree.dir ? await resolveRef({ dir: worktree.dir, ref: 'HEAD' }) : '';
        return {
            mergeStatus: {
                oid: oid ? oid : '',
                alreadyMerged: false,
                fastForward: false,
                mergeCommit: false
            },
            stdout: '',
            stderr: 'Unable to locate branch root.'
        }
    }
    let mergeResults: { stdout: string; stderr: string; } = { stdout: '', stderr: '' };
    let mergeError: ExecError | undefined;
    if (onProgress) await onProgress({ phase: `Merging: ${compare} into ${base}`, loaded: 1, total: 2 });
    try {
        const cmd = `git merge ${base} ${compare}`;
        console.log(`Running command: '${cmd}' in '${branchRoot.toString()}'`)
        mergeResults = await promiseExec(`git merge ${base} ${compare}`, { cwd: branchRoot.toString() });
    } catch (error) {
        mergeError = error as ExecError;
        const conflictPattern = /(?<=conflict in ).*(?=\n)/gm;
        const mergeOutput = mergeError ? `${mergeError.stdout}\n${mergeError.stderr}` : '';
        const conflicts = mergeOutput.match(conflictPattern)?.map(filename => path.resolve(branchRoot.toString(), filename));
        const oid = worktree.dir ? await resolveRef({ dir: branchRoot, ref: 'HEAD' }) : '';
        if (onProgress) await onProgress({ phase: `Halting merge: ${compare} into ${base}`, loaded: 2, total: 2 });
        return {
            mergeStatus: {
                oid: oid ? oid : '',
                alreadyMerged: false,
                fastForward: mergeError ? false : true,
                mergeCommit: mergeError ? false : true,
            },
            mergeConflicts: conflicts ? conflicts : [],
            stdout: mergeError.stdout,
            stderr: mergeError.stderr
        };
    }
    const oid = worktree.dir ? await resolveRef({ dir: branchRoot, ref: 'HEAD' }) : '';
    if (onProgress) await onProgress({ phase: `Finishing merge: ${compare} into ${base}`, loaded: 2, total: 2 });
    return {
        mergeStatus: {
            oid: oid ? oid : '',
            alreadyMerged: false,
            fastForward: mergeError ? false : true,
            mergeCommit: mergeError ? false : true,
        },
        stdout: mergeResults.stdout,
        stderr: mergeResults.stderr
    };
}

/**
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link gitMerge.checkUnmergedPath} instead.
 * @param filepath A filepath...
 * @param ignoreManager An Ignore manager instance
 * @returns {Promise<Conflict | undefined>} A Promise object...
 */
export const checkFilepath = async (filepath: fs.PathLike, ignoreManager?: Ignore): Promise<Conflict | undefined> => {
    const { dir, worktreeDir } = await getWorktreePaths(filepath);

    const isDir = await io.isDirectory(filepath);
    if (dir && !isDir) {
        const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
        const ignore = ignoreManager
            ? ignoreManager
            : (worktreeDir ? (await getIgnore(worktreeDir, true)) : (await getIgnore(dir, true)));
        const relativePath = worktreeDir
            ? path.relative(worktreeDir.toString(), filepath.toString())
            : path.relative(dir.toString(), filepath.toString());
        if (ignore.ignores(relativePath)) return undefined;
        const content = await io.readFileAsync(filepath, { encoding: 'utf-8' });
        const matches = Array.from(content.matchAll(conflictPattern));
        const conflicts: number[] = removeUndefined(matches.map(m => isDefined(m.index) ? m.index : undefined));
        if (conflicts.length > 0) return { path: filepath, conflicts: conflicts };
    }
    return undefined;
};

/**
 * Check for conflicts in a base branch after attempting to merge.
 *
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link gitMerge.checkUnmergedBranch} instead.
 * @param dir The root directory of either the main worktree or linked worktree.
 * @param branch The name of the branch to check against (i.e. the base branch).
 * @returns {Promise<Conflict[]>} A Promise object containing an array of conflict information found in the specified branch.
 */
export const checkProject = async (dir: fs.PathLike, branch: string): Promise<Conflict[]> => {
    const branchRoot = await getBranchRoot(dir, branch);
    const worktree = await getWorktreePaths(dir);
    const current = await currentBranch({ dir });
    // skip any locally-tracked branches that are not checked out in the main worktree directory
    const trackedLocalBranch = (branchRoot && worktree.dir) ? io.isEqualPaths(branchRoot, worktree.dir) && branch !== current : false;
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
 * Abort the merging of branches; useful when merge conflicts arise and need to be backed out. This function is a wrapper to the 
 * git* command-line utility, which differs from most git commands in Synectic that rely upon the *isomorphic-git* module. This function
 * can handle merging across linked worktrees.
 *
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link gitMerge.mergeInProgress} with `abort` option instead.
 * @param dir The worktree root directory path.
 */
export const abortMerge = async (dir: fs.PathLike): Promise<void> => {
    const worktree = await getWorktreePaths(dir);
    const root = worktree.worktreeDir ? worktree.worktreeDir : worktree.dir;
    const gitdir = worktree.worktreeDir ? worktree.worktreeLink : worktree.gitdir;
    const merging = gitdir ? await io.extractStats(path.join(gitdir.toString(), 'MERGE_HEAD')) : undefined;

    if (root && merging) {
        const result = await execute(`git merge --abort`, root.toString());
        if (result.stderr.length > 0) console.log(`Abort failed: ${root.toString()}`);
        else console.log(`Abort succeeded: ${root.toString()}`);
    }
}

/**
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link gitMerge.mergeInProgress} with `continue` option instead.
 * @param dir - X
 * @param compareBranch - X
 */
export const resolveMerge = async (dir: fs.PathLike, compareBranch: string): Promise<void> => {
    const worktree = await getWorktreePaths(dir);
    const root = worktree.worktreeDir ? worktree.worktreeDir : worktree.dir;
    const gitdir = worktree.worktreeDir ? worktree.worktreeLink : worktree.gitdir;
    const merging = gitdir ? await io.extractStats(path.join(gitdir.toString(), 'MERGE_HEAD')) : undefined;

    if (root && merging) {
        const result = await execute(`git commit -m "Merge branch '${compareBranch}'"`, root.toString());
        if (result.stderr.length > 0) console.log(`Resolve failed: ${root.toString()}`);
        else console.log(`Resolve succeeded: ${root.toString()}`);
    }
}

/**
 * Resolve the names of branches involved in a merge conflict, given the root directory path of the base branch. If the base branch is a linked worktree, then 
 * this function will extract the branch names from the GIT_DIR/worktrees/{branch}/MERGE_MSG file which has content similar to:
 * ```bash
 * Merge remote-tracking branch 'origin/compare' into base
 * 
 * # Conflicts:
 * #	components/list/index.tsx
 * ```
 * 
 * If the base branch is located in the main worktree directory, then we extract the branch names from the GIT_DIR/MERGE_MSG file which has content similar to:
 * ```bash
 * Merge branch 'compare'
 *
 * # Conflicts:
 * #	components/list/index.tsx
 * ```
 *
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link gitMerge.mergeInProgress} with `continue` option instead.
 * @param root The root directory of the base branch involved in the conflicting merge; the main worktree or linked worktree are acceptable.
 * @returns {Promise<{ base: string | undefined; compare: string; }>} A Promise object containing the base branch name (or undefined if not included in the MERGE_MSG file) and the compare branch
 * name.
 */
export const resolveConflicts = async (root: fs.PathLike): Promise<{ base: string | undefined, compare: string }> => {
    console.log(`resolveConflicts => root: ${root.toString()}`);
    const branchPattern = /(?<=Merge( remote-tracking)? branch(es)? .*)('.+?')+/gm; // Match linked worktree and main worktree patterns (shown above)
    const { gitdir, worktreeLink } = await getWorktreePaths(root);
    const mergeMsg = worktreeLink ? await io.readFileAsync(path.join(worktreeLink.toString(), 'MERGE_MSG'), { encoding: 'utf-8' })
        : gitdir ? await io.readFileAsync(path.join(gitdir.toString(), 'MERGE_MSG'), { encoding: 'utf-8' }) : '';
    const match = mergeMsg.match(branchPattern);
    return match
        ? match.length === 2
            ? { base: (match[0] as string).replace(/['"]+/g, ''), compare: (match[1] as string).replace(/['"]+/g, '') }
            : { base: undefined, compare: (match[0] as string).replace(/['"]+/g, '') }
        : { base: undefined, compare: '' };
};