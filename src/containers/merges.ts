import { exec } from 'child_process';
import util from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { isLinkedWorktree } from './git-worktree';
import { getRepoRoot } from './git-porcelain';
import { readFileAsync } from './io';

const promiseExec = util.promisify(exec);

export const merge = async (dir: fs.PathLike, base: string, compare: string): Promise<{ mergeStatus: isogit.MergeResult }> => {
    const gitdir = path.join(dir.toString(), '.git');
    const baseDir = (await isLinkedWorktree({ gitdir: gitdir })) ?
        (await readFileAsync(gitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim()
        : (await getRepoRoot(dir));
    try {
        promiseExec(`git merge ${base} ${compare}`, { cwd: baseDir })
    } catch (e) {
        console.log('MERGE ERROR');
        console.error(e);
    }
    return {
        mergeStatus: {
            oid: '3',
            alreadyMerged: true,
            fastForward: true,
            mergeCommit: false,
        }
    };
}