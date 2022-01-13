import * as fs from 'fs-extra';
import * as path from 'path';
import { findRoot, listBranches } from 'isomorphic-git';
import * as io from './io';

export type WorktreePaths = {
    /** The main worktree root directory (e.g. *'/{project}'*), or `undefined` if not under version control. */
    dir: fs.PathLike | undefined;
    /** The main worktree git directory (i.e. `GIT_DIR`, such as *'/{project}/.git'*), or `undefined` if not under version control). */
    gitdir: fs.PathLike | undefined;
    /** The linked worktrees directory (i.e. `GIT_DIR/worktrees`, such as *'/{project}/.git/worktrees'*). */
    worktrees: fs.PathLike | undefined;
    /** The linked worktree root directory (i.e. `/{project}/../.syn/{branch}`), or `undefined` if not a linked worktree. */
    worktreeDir: fs.PathLike | undefined;
    /** The linked worktree git file (e.g. *'/{project}/../.syn/{branch}/.git'*, or `undefined` if not a linked worktree. */
    worktreeGitdir: fs.PathLike | undefined;
    /** The direct link from linked worktree into the linked worktrees directory (i.e. `GIT_DIR/worktrees/{branch}`); this path
     * is found in the linked worktree git file (`worktreeGitdir`) */
    worktreeLink: fs.PathLike | undefined;
}

/**
 * Find the root git directory. Starting at filepath, walks upward until it finds a directory that contains a *.git* subdirectory 
 * (i.e. the `dir` in the `WorktreePaths` type). In the case of linked worktrees (see [git-worktree](https://git-scm.com/docs/git-worktree)), 
 * this will find and return a directory that contains a *.git* file instead (i.e. the `worktreeDir` in the `WorktreePaths` type).
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root git directory path, or undefined if no root git directory exists for the filepath 
 * (i.e. the filepath is not part of a Git repository).
 */
export const getRoot = async (filepath: fs.PathLike): Promise<fs.PathLike | undefined> => {
    try {
        const root = await findRoot({ fs: fs, filepath: filepath.toString() });
        return root;
    }
    catch (e) {
        return undefined;
    }
};

/**
 * Find the root git directory for a specific branch. For branches on a linked worktree, this corresponds to 
 * the `worktreeDir` in the `WorktreePaths` type. For all other locally tracked branches (i.e. branches that have 
 * previously been checked out), this corresponds to the `dir` in the `WorktreePaths` type.
 * @param dir The relative or absolute path to the main worktree root directory (i.e. the `dir` in the `WorktreePaths` type).
 * @param branch Name of the target branch.
 * @returns A Promise object containing the root git directory path, or undefined if no root git directory exists 
 * for the branch (i.e. the branch is remote-only or non-existent for the given repository).
 */
export const getBranchRoot = async (dir: fs.PathLike, branch: string) => {
    const existsLocal = (await listBranches({ fs: fs, dir: dir.toString() })).includes(branch);
    if (!existsLocal) return undefined; // branch is either remote-only or non-existent

    // check to see if the branch matches one of the linked worktrees
    const gitWorktrees = path.join(dir.toString(), '.git', 'worktrees');
    const worktreeRoot = await fs.stat(gitWorktrees)
        .then(async () => {
            const worktreeBranches = await io.readDirAsync(gitWorktrees);
            const match = worktreeBranches.find(w => w === branch);
            if (match) {
                // reading the `{dir}/.git/worktrees/{branch}/gitdir` file
                return path.dirname((await io.readFileAsync(path.join(gitWorktrees, match, 'gitdir'), { encoding: 'utf-8' })).trim());
            }
        })
        .catch(() => { return undefined });

    return worktreeRoot ? worktreeRoot : dir;
}

/**
 * Find the worktree paths required for handling objects tracked under git-based version control. This function is 
 * capable of discerning paths maintained in linked worktrees and translating paths accordingly.
 * @param target The relative or absolute path to a file or directory.
 * @returns A `WorktreePaths` object containing all valid paths, and excluding any irrelevant paths (i.e. paths 
 * associated with linked worktrees when the target is maintained in the main worktree directory).
 */
export const getWorktreePaths = async (target: fs.PathLike): Promise<WorktreePaths> => {
    const root = await getRoot(target);
    // check for target parameter being contained within a linked worktree
    const isLinkedWorktree = root ? !(await io.isDirectory(path.join(root.toString(), '.git'))) : false;
    // check for target parameter being contained within a `GIT_DIR/worktrees/{branch}` directory
    const isWorktreesDir = root ? /^\.git([\\]+|\/)worktrees([\\]+|\/).+/.test(path.relative(root.toString(), target.toString())) : false;

    if (isWorktreesDir && root) {
        const dir = root;
        const gitdir = dir ? path.join(dir.toString(), '.git') : undefined;
        const worktrees = gitdir ? path.join(gitdir, 'worktrees') : undefined;

        const match = path.relative(dir.toString(), target.toString()).match(/(?<=^\.git[\\/]+worktrees[\\/]+)([^\\/\n]+)/);
        const branch = match ? match[0] : undefined;

        const worktreeGitdir = (worktrees && branch) ?
            (await io.readFileAsync(path.join(worktrees, branch, 'gitdir'), { encoding: 'utf-8' })).trim() : undefined;
        const worktreeDir = worktreeGitdir ? path.normalize(path.join(worktreeGitdir, '..')) : undefined;
        const worktreeLink = worktreeGitdir ?
            (await io.readFileAsync(worktreeGitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim() : undefined;

        return { dir, gitdir, worktrees, worktreeDir, worktreeGitdir, worktreeLink };
    }

    // calculate paths associated with a linked worktree
    const worktreeDir = isLinkedWorktree ? root : undefined;
    const worktreeGitdir = worktreeDir ? path.join(worktreeDir.toString(), '.git') : undefined;
    const worktreeLink = worktreeGitdir ?
        (await io.readFileAsync(worktreeGitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim() : undefined;

    // calculate paths associated with the main worktree
    const dir = !isLinkedWorktree ? root : (await getRoot(worktreeLink as string));
    const gitdir = dir ? path.join(dir.toString(), '.git') : undefined;
    const worktreesPath = gitdir ? path.join(gitdir, 'worktrees') : undefined;
    // verify that the `GIT_DIR/worktrees` directory exists
    const worktrees = worktreesPath && !(await io.extractStats(worktreesPath)) ? undefined : worktreesPath;

    return { dir, gitdir, worktrees, worktreeDir, worktreeGitdir, worktreeLink };
}

