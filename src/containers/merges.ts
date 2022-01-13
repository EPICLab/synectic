import { exec } from 'child_process';
import util from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { resolveRef } from './git-porcelain';
import { branchLog } from './git-plumbing';
import { getWorktreePaths } from './git-path';

const promiseExec = util.promisify(exec);

type ExecError = {
    killed: boolean,
    code: number,
    signal: string | null,
    cmd: string,
    stdout: string,
    stderr: string
}

export type MergeResult = {
    mergeStatus: isogit.MergeResult,
    mergeConflicts?: string[],
    stdout: string,
    stderr: string
}

/**
 * Merge two branches; combining new commits from `compare` branch onto the `base` branch history. This function is a wrapper to the 
 * *git* command-line utility, which differs from most git commands in Synectic that rely upon the *isomorphic-git* module. This function
 * can handle merging across linked worktrees.
 * @param dir The worktree root directory path.
 * @param base The base branch where newly merged commits should be added.
 * @param compare The compare branch for deriving mergeable commits.
 * @returns A Promise object containing the merge results (per https://isomorphic-git.org/docs/en/merge), 
 * exec shell-command output (`stdout` and `stderr`), and a list of files containing conflicts (if a merge conflict prevented the merge).
 */
export const merge = async (dir: fs.PathLike, base: string, compare: string): Promise<MergeResult> => {
    const { worktreeLink } = await getWorktreePaths(dir);

    if (!worktreeLink) return {
        mergeStatus: {
            oid: '',
            alreadyMerged: false,
            fastForward: false,
            mergeCommit: false,
        },
        stdout: '',
        stderr: ''
    }

    const commitDelta = await branchLog(worktreeLink, base, compare);
    if (worktreeLink && commitDelta.length == 0) {
        const oid = await resolveRef(worktreeLink, 'HEAD');
        return {
            mergeStatus: {
                oid: oid ? oid : '',
                alreadyMerged: true,
                fastForward: false,
                mergeCommit: false
            },
            stdout: '',
            stderr: ''
        }
    }

    let mergeResults: { stdout: string; stderr: string; } = { stdout: '', stderr: '' };
    let mergeError: ExecError | undefined;
    try {
        mergeResults = await promiseExec(`git merge ${base} ${compare}`, { cwd: worktreeLink.toString() });
    } catch (error) {
        mergeError = error as ExecError;
        const conflictPattern = /(?<=content conflict in ).*?(?=\n)/gm;
        const conflicts = mergeError ? mergeError.stderr.match(conflictPattern)?.map(filename => path.resolve(worktreeLink.toString(), filename)) : [];
        const oid = await resolveRef(worktreeLink, 'HEAD');
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
    const oid = await resolveRef(worktreeLink, 'HEAD');
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