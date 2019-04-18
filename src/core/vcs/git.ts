import * as fs from 'fs-extra';
import * as path from 'path';
// import * as util from 'util';
import * as git from 'isomorphic-git';
import * as io from '../fs/io';
import { basename } from 'path';

export * from 'isomorphic-git';

// Lim requires a function that will compare a local file against the latest
// version on a git branch, and returns boolean for diff.

export async function fetchRepo(directory: fs.PathLike) {
  await git.fetch({
    dir: directory.toString(),
    token: '02382a038d912a9fc9fd88b7feb77d5084ff30f0',
    oauth2format: 'github',
    depth: 1,
    singleBranch: false,
    tags: false
  });
  console.log('done');
}

export async function getRepoFullname(): Promise<string> {
  const value = await git.config({
    dir: '/',
    path: 'user.name'
  });
  console.log('user-name: ' + value);
  return new Promise((resolve, _) => {
    resolve('test');
  });
}

export async function checkoutFile(filepath: fs.PathLike, branch: string): Promise<string> {
  // TODO: Big optimization is possible here.
  // The 'checkout' command from isomorphic-git currently deletes and rewrites
  // everything in the project as part of a branch checkout, even when a pattern
  // is supplied. This forces us to checkout the target branch, grab the file
  // we are interested in and move it to a temporary location, switch back to
  // the original branch and return the path to the temporary file for loading
  // by the card.
  const repoRoot = await getRepoRoot(filepath);
  const currentBranch = await git.currentBranch({ dir: repoRoot, fullname: false });
  const relativePath = path.relative(repoRoot, filepath.toString());
  let targetPath = '';
  if (branch === currentBranch) {
    targetPath = path.join(repoRoot, basename(filepath.toString()));
  } else {
    targetPath = path.join(repoRoot, '/.git/tmp/', basename(filepath.toString()));
    await git.checkout({ dir: repoRoot, ref: branch, pattern: relativePath });
    await fs.move(filepath.toString(), targetPath, { overwrite: true });
    await git.checkout({ dir: repoRoot, ref: currentBranch });
  }
  return targetPath;
}

/**
 * Read remote name and URL from Git directory path.
 * Git protocol allows multiple remotes to be set per repository.
 * @param gitdir The git directory path.
 * @return A list of git.RemoteDefinition objects, each containing `remote` and `url` fields.
 */
export async function getRemotes(gitdir: fs.PathLike): Promise<git.RemoteDefinition[]> {
  return git.listRemotes({ dir: gitdir.toString() });
}

/**
 * Recursively walk up directories from path to locate Git directory path.
 * @param p A path to a file or directory that is under Git version control.
 * @param relative (Optional) Flag for generating a relative path to the Git directory path.
 * @return The absolute (or relative) path to the Git path directory.
 */
export async function getRepoRoot(p: fs.PathLike, relative?: boolean): Promise<string> {
  const rootPath = git.findRoot({ filepath: p.toString() });
  return relative ? path.relative(await rootPath, p.toString()) : rootPath;
}

/**
 * Asynchronously aggregate local and remote branches based on Git repository.
 * @param gitdir The git directory path.
 * @return A deduplicated array of all branch names for the Git repository.
 */
export async function getAllBranches(gitdir: fs.PathLike): Promise<string[]> {
  const local = await getLocalBranches(gitdir);
  const remote = await getRemoteBranches(gitdir);
  const allBranches = new Set(local.concat(remote));
  return Array.from(allBranches.values());
}

/**
 * Asynchronously aggregate local branches based on Git repository.
 * @param gitdir The git directory path.
 * @return An array of local branch names for the Git repository.
 */
export async function getLocalBranches(gitdir: fs.PathLike): Promise<string[]> {
  return git.listBranches({ dir: gitdir.toString() });
}

/**
 * Asynchronously aggregate remote branches based on Git repository.
 * @param gitdir The git directory path.
 * @return An array of remote branch names for the Git repository.
 */
export async function getRemoteBranches(gitdir: fs.PathLike): Promise<string[]> {
  return git.listBranches({ dir: gitdir.toString(), remote: 'origin' });
}

/**
 * Synchronously validate that directory is Git directory path (i.e. contains .git file).
 * @param directory A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @return Boolean indicating directory is a Git directory path.
 */
export function isGitRepo(directory: fs.PathLike): boolean {
  const p: string = path.resolve(path.join(directory.toString(), '/.git'));
  // TODO: Handle cases where directory includes a filename which needs to be removed.
  let result: boolean;
  try {
    fs.statSync(p);
    result = true;
  } catch (error) {
    result = false;
  }
  return result;
}

/**
 * Asynchronously validate that directory is Git directory path (i.e. contains .git file).
 * @param directory A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @return Boolean indicating directory is a Git directory path.
 */
export function isGitRepoAsync(directory: fs.PathLike): Promise<boolean> {
  const p: string = path.resolve(path.join(directory.toString(), '/.git'));
  return io.exists(p);
}
