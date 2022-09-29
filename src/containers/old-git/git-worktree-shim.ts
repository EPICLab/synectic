import * as fs from 'fs-extra';
import * as path from 'path';
import { GitStatus } from '../../store/types';
import { getWorktreePaths } from '../git';
import { execute } from '../utils';
import { codeToStatus } from './git-plumbing';

/**
 * @deprecated
 * @param dirpath - X
 * @param worktreeDir - X 
 * @param url - X
 * @param commitish - X 
 * @returns {Promise<void>} X
 */
export const add = async (dirpath: fs.PathLike, worktreeDir: fs.PathLike, url: string, commitish?: string): Promise<void> => {
    const { dir } = await getWorktreePaths(dirpath);
    if (!dir) return undefined; // not under version control

    try {
        await execute(`git worktree add ${worktreeDir?.toString()} ${commitish ? commitish : ''}`, dir.toString());
    } catch (error) {
        console.error(`git-worktree add error:`, error);
    }
    return;
}

/**
 * @deprecated
 * @param dirpath - X
 * @returns {Promise<{ filepath: string; status: GitStatus | undefined }[] | undefined>} X
 */
export const statusMatrix = async (dirpath: fs.PathLike): Promise<{ filepath: string; status: GitStatus | undefined }[] | undefined> => {
    const { dir, worktreeDir, worktreeLink } = await getWorktreePaths(dirpath);
    if (!worktreeDir || !worktreeLink) return undefined; // filepath is not part of a linked worktree, must use `git-plumbing.matrixEntry` for main worktree
    if (!dir) return undefined; // not under version control

    const statusCodeRaw = await execute(`git status --porcelain`, worktreeDir.toString());
    const diffCodeRaw = await execute(`git diff-files --name-status`, worktreeDir.toString());

    const statusFilenamePattern = /(?<=[A-Z?! ]{2} ).*/gm;
    const statusFilenames = statusCodeRaw.stdout.match(statusFilenamePattern);

    return statusFilenames?.map(filename => {
        const relativePath = path.relative(worktreeDir.toString(), filename);

        const statusCodePattern = new RegExp('^[A-Z?! ]{2}(?= ' + relativePath.replace(/\./g, '\\.') + ')', 'gm');
        const statusCode = statusCodePattern.exec(statusCodeRaw.stdout)?.[0]; // Matches all status codes (always length 2)
        const diffCodePattern = new RegExp('^[A-Z](?=\\t' + relativePath.replace(/\./g, '\\.') + ')', 'gm');
        const diffCode = diffCodePattern.exec(diffCodeRaw.stdout)?.[0]; // Matches all git-diff-files codes (always alphabetic and length 1)

        return { filepath: relativePath, status: codeToStatus(statusCode, diffCode) };
    });
}

/**
 * @deprecated
 * @param filepath - X
 * @returns {Promise<GitStatus | undefined>} X
 */
export const status = async (filepath: fs.PathLike): Promise<GitStatus | undefined> => {
    const { dir, worktreeDir, worktreeLink } = await getWorktreePaths(filepath);
    if (!worktreeDir || !worktreeLink) return undefined; // filepath is not part of a linked worktree, must use `git-plumbing.matrixEntry` for main worktree
    if (!dir) return undefined; // not under version control

    const relativePath = path.relative(worktreeDir.toString(), filepath.toString());
    const statusCodeRaw = await execute(`git status --porcelain --ignored ${relativePath}`, worktreeDir.toString());
    const diffCodeRaw = await execute(`git diff-files --name-status`, worktreeDir.toString());

    const statusCodePattern = new RegExp('^[A-Z?! ]{2}(?= ' + relativePath.replace(/\./g, '\\.') + ')', 'gm');
    const statusCode = statusCodePattern.exec(statusCodeRaw.stdout)?.[0]; // Matches all status codes (always length 2)
    const diffCodePattern = new RegExp('^[A-Z](?=\\t' + relativePath.replace(/\./g, '\\.') + ')', 'gm');
    const diffCode = diffCodePattern.exec(diffCodeRaw.stdout)?.[0]; // Matches all git-diff-files codes (always alphabetic and length 1)

    return codeToStatus(statusCode, diffCode);
}