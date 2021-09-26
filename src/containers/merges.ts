import { exec } from 'child_process';
import util from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { isLinkedWorktree } from './git-worktree';
import { getRepoRoot, resolveRef } from './git-porcelain';
import { readFileAsync } from './io';
import { branchLog } from './git-plumbing';

const promiseExec = util.promisify(exec);

type ExecResult = {
    killed: boolean,
    code: number,
    signal: string | null,
    cmd: string,
    stdout: string,
    stderr: string
}

export const merge = async (dir: fs.PathLike, base: string, compare: string): Promise<{ mergeStatus: isogit.MergeResult }> => {
    const gitdir = path.join(dir.toString(), '.git');
    const baseDir = (await isLinkedWorktree({ gitdir: gitdir })) ?
        (await readFileAsync(gitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim()
        : (await getRepoRoot(dir));

    const commitDelta = await branchLog(baseDir, base, compare);
    if (commitDelta.length == 0) return {
        mergeStatus: {
            oid: await resolveRef(baseDir, 'HEAD'),
            alreadyMerged: true,
            fastForward: false,
            mergeCommit: false
        }
    }

    let mergeResults: { stdout: string; stderr: string; } = { stdout: '', stderr: '' };
    let mergeError: ExecResult | undefined;
    try {
        mergeResults = await promiseExec(`git merge ${base} ${compare}`, { cwd: baseDir });
        console.log(`MERGE: ${mergeResults.stdout}`);
    } catch (error) {
        mergeError = error as ExecResult;
        const conflictPattern = /(?<=content conflict in ).*?(?=\n)/gm;
        const conflicts = mergeError.stderr.match(conflictPattern);
        console.log(`MERGE CONFLICTS: Conflicts in files => ${JSON.stringify(conflicts)}`);
    }
    return {
        mergeStatus: {
            oid: await resolveRef(baseDir, 'HEAD'),
            alreadyMerged: false,
            fastForward: mergeError ? false : true,
            mergeCommit: mergeError ? false : true,
        }
    };
}