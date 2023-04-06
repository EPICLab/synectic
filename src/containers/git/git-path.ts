import { findUp, Match } from 'find-up';
import { pathExists, PathLike } from 'fs-extra';
import { dirname, join, normalize, parse, relative } from 'path';
import { extractStats, isDirectory, readDirAsync, readFileAsync } from '../io';
import { showBranch } from './git-show-branch';

export type WorktreePaths = {
  /** The main worktree root directory (e.g. *'/{project}'*), or `undefined` if not under version control. */
  dir: PathLike | undefined;
  /** The main worktree git directory (i.e. `GIT_DIR`, such as *'/{project}/.git'*), or `undefined` if not under version control). */
  gitdir: PathLike | undefined;
  /** The linked worktrees directory (i.e. `GIT_DIR/worktrees`, such as *'/{project}/.git/worktrees'*). */
  worktrees: PathLike | undefined;
  /** The linked worktree root directory (i.e. `/{project}/../.syn/{repo}/{branch}`), or `undefined` if not a linked worktree. */
  worktreeDir: PathLike | undefined;
  /** The linked worktree git file (e.g. *'/{project}/../.syn/{repo}/{branch}/.git'*, or `undefined` if not a linked worktree. */
  worktreeGitdir: PathLike | undefined;
  /**
   * The direct link from linked worktree into the linked worktrees directory (i.e. `GIT_DIR/worktrees/{branch}`); this path
   * is found in the linked worktree git file (`worktreeGitdir`).
   */
  worktreeLink: PathLike | undefined;
};

/**
 * Find the root git directory. Starting at filepath, walks upward until it finds a directory that contains a *.git* subdirectory (i.e. the
 * `dir` in the `WorktreePaths` type). In the case of linked worktrees (see [git-worktree](https://git-scm.com/docs/git-worktree)), this
 * will find and return a directory that contains a *.git* file instead (i.e. the `worktreeDir` in the `WorktreePaths` type). The resulting
 * path is relative to the earliest directory in the given `filepath` (i.e. `/user/dir/file.txt` returns `/user/dir` even though
 * `/home/user/dir` might be the full path to that directory); this translates into absolute paths yielding absolute paths, and relative
 * paths yielding relative paths.
 *
 * @param filepath - The relative or absolute path to evaluate.
 * @returns {Promise<PathLike | undefined>} A Promise object containing the root git directory path, or undefined if no root git directory
 * exists for the filepath (i.e. the filepath is not part of a Git repository).
 */
export const getRoot = async (filepath: PathLike): Promise<PathLike | undefined> => {
  const exists = await pathExists(filepath.toString());
  if (!exists)
    throw new Error(`ENOENT: no such file or directory, getRoot '${filepath.toString()}'`);

  const matcher: (directory: string) => Match | Promise<Match> = async (directory: string) => {
    const targetPath = join(directory, '.git');
    return (await pathExists(targetPath)) ? directory : undefined;
  };

  const dir = await findUp(matcher, { cwd: filepath.toString(), type: 'directory' });
  if (!dir) return undefined;

  const parsed = parse(filepath.toString()); // does not output relative root for relative filepaths
  const inputRoot = parsed.root.length > 0 ? parsed.root : filepath.toString().split(/[\\/]/)[0];
  const root = inputRoot ? join(inputRoot, relative(inputRoot, dir)) : dir;

  return normalize(root);
};

/**
 * Find the root git directory for a specific branch. For branches on a linked worktree, this corresponds to
 * the `worktreeDir` in the `WorktreePaths` type. For all other locally tracked branches (i.e. branches that have
 * previously been checked out), this corresponds to the `dir` in the `WorktreePaths` type.
 *
 * @param root - The relative or absolute path to a root directory (i.e. the `dir` or `worktreeDir` in the `WorktreePaths` type).
 * @param branch - Name of the target branch.
 * @returns {Promise<PathLike | undefined>} A Promise object containing the root git directory path, or undefined if no root git directory exists
 * for the branch (i.e. the branch is remote-only or non-existent for the given repository).
 */
export const getBranchRoot = async (
  root: PathLike,
  branch: string
): Promise<PathLike | undefined> => {
  const { dir, worktrees } = await getWorktreePaths(root);
  const existsLocally =
    dir && (await showBranch({ dir: dir })).find(b => b.ref === branch) ? true : false;
  if (!existsLocally) return undefined; // branch is either remote-only or non-existent

  // check to see if the branch matches one of the linked worktrees
  const worktreeBranches = worktrees ? await readDirAsync(worktrees) : undefined;
  const match = worktreeBranches ? worktreeBranches.find(w => w === branch) : undefined;

  // reading the `{dir}/.git/worktrees/{branch}/gitdir` file
  const worktreeRoot =
    match && worktrees
      ? dirname(
          (await readFileAsync(join(worktrees.toString(), match, 'gitdir'), { encoding: 'utf-8' }))
            .toString()
            .trim()
        )
      : undefined;

  return worktreeRoot ? worktreeRoot : dir;
};

/**
 * Find the worktree paths required for handling objects tracked under git-based version control. This function is
 * capable of discerning paths maintained in linked worktrees and translating paths accordingly.
 *
 * @param target - The relative or absolute path to a file or directory.
 * @returns {Promise<WorktreePaths>} A `WorktreePaths` object containing all valid paths, and excluding any irrelevant paths (i.e. paths
 * associated with linked worktrees when the target is maintained in the main worktree directory).
 */
export const getWorktreePaths = async (target: PathLike): Promise<WorktreePaths> => {
  const root = await getRoot(target);
  // check for target parameter being contained within a linked worktree
  const isLinkedWorktree = root ? !(await isDirectory(join(root.toString(), '.git'))) : false;
  // check for target parameter being contained within a `GIT_DIR/worktrees/{branch}` directory
  const isWorktreesDir = root
    ? /^\.git([\\]+|\/)worktrees([\\]+|\/).+/.test(relative(root.toString(), target.toString()))
    : false;

  if (isWorktreesDir && root) {
    const dir = root;
    const gitdir = dir ? join(dir.toString(), '.git') : undefined;
    const worktrees = gitdir ? join(gitdir, 'worktrees') : undefined;

    const match = relative(dir.toString(), target.toString()).match(
      /(?<=^\.git[\\/]+worktrees[\\/]+)([^\\/\n]+)/
    );
    const branch = match ? match[0] : undefined;

    const worktreeGitdir =
      worktrees && branch
        ? (await readFileAsync(join(worktrees, branch, 'gitdir'), { encoding: 'utf-8' }))
            .toString()
            .trim()
        : undefined;
    const worktreeDir = worktreeGitdir ? join(worktreeGitdir, '..') : undefined;
    const worktreeGitdirExists = worktreeGitdir ? await pathExists(worktreeGitdir) : false;
    const worktreeLink =
      worktreeGitdir && worktreeGitdirExists
        ? (await readFileAsync(worktreeGitdir, { encoding: 'utf-8' }))
            .toString()
            .slice('gitdir: '.length)
            .trim()
        : undefined;

    return { dir, gitdir, worktrees, worktreeDir, worktreeGitdir, worktreeLink };
  }

  // calculate paths associated with a linked worktree
  const worktreeDir = isLinkedWorktree ? root : undefined;
  const worktreeGitdir = worktreeDir ? join(worktreeDir.toString(), '.git') : undefined;
  const worktreeLink = worktreeGitdir
    ? (await readFileAsync(worktreeGitdir, { encoding: 'utf-8' }))
        .toString()
        .slice('gitdir: '.length)
        .trim()
    : undefined;

  // calculate paths associated with the main worktree
  const dir = !isLinkedWorktree ? root : await getRoot(worktreeLink as string);
  const gitdir = dir ? join(dir.toString(), '.git') : undefined;
  const worktreesPath = gitdir ? join(gitdir, 'worktrees') : undefined;
  // verify that the `GIT_DIR/worktrees` directory exists
  const worktrees =
    worktreesPath && !(await extractStats(worktreesPath)) ? undefined : worktreesPath;

  return { dir, gitdir, worktrees, worktreeDir, worktreeGitdir, worktreeLink };
};
