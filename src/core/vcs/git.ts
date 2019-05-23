import * as fs from 'fs-extra';
import * as path from 'path';
// import * as util from 'util';
import * as git from 'isomorphic-git';
import * as io from '../fs/io';
import * as url from 'url';

export * from 'isomorphic-git';

export async function checkoutFile(filepath: fs.PathLike, branch: string): Promise<string> {
  // TODO: Big optimization is possible here.
  // The 'checkout' command from isomorphic-git currently deletes and rewrites
  // everything in the project as part of a branch checkout, even when a pattern
  // is supplied. This forces us to checkout the target branch, grab the file
  // we are interested in and move it to a temporary location, switch back to
  // the original branch and return the path to the temporary file for loading
  // by the card.
  const repoRoot = await getRepoRoot(filepath);
  const currentBranch = await git.currentBranch({ dir: repoRoot.toString(), fullname: false });
  const relativePath = path.relative(repoRoot.toString(), filepath.toString());
  let targetPath = '';
  if (branch === currentBranch) {
    targetPath = path.join(repoRoot.toString(), path.basename(filepath.toString()));
  } else {
    targetPath = path.join(repoRoot.toString(), '/.git/tmp/', path.basename(filepath.toString()));
    await git.checkout({ dir: repoRoot.toString(), ref: branch, pattern: relativePath });
    await fs.move(filepath.toString(), targetPath, { overwrite: true });
    await git.checkout({ dir: repoRoot.toString(), ref: currentBranch });
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
export async function getRepoRoot(p: fs.PathLike, relative?: boolean): Promise<fs.PathLike> {
  const rootPath = git.findRoot({ filepath: p.toString() });
  return relative ? path.relative(await rootPath, p.toString()) : rootPath;
}

/**
 * Asynchronously aggregate local and remote branches based on Git repository.
 * @param gitdir The git directory path.
 * @return A deduplicated array of all branch names for the Git repository.
 */
export async function getAllBranches(dir: fs.PathLike): Promise<string[]> {
  const local = await getLocalBranches(dir);
  const remote = await getRemoteBranches(dir);
  const allBranches = new Set(local.concat(remote));
  return Array.from(allBranches.values());
}

/**
 * Asynchronously aggregate local branches based on Git repository.
 * @param gitdir The git directory path.
 * @return An array of local branch names for the Git repository.
 */
export async function getLocalBranches(dir: fs.PathLike): Promise<string[]> {
  return git.listBranches({ dir: dir.toString() });
}

/**
 * Asynchronously aggregate remote branches based on Git repository.
 * @param gitdir The git directory path.
 * @return An array of remote branch names for the Git repository.
 */
export async function getRemoteBranches(dir: fs.PathLike): Promise<string[]> {
  return git.listBranches({ dir: dir.toString(), remote: 'origin' });
}

/**
 * Asynchronously determine current branch based on Git repository.
 * @param gitdir The git directory path.
 * @return A branch name; or undefined if no branch was found.
 */
export async function getCurrentBranch(dir: fs.PathLike): Promise<string | undefined> {
  return git.currentBranch({ dir: dir.toString(), fullname: false });
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

/**
 * Convert remote URL from SSH to HTTPS format.
 * @param remoteUrl The remote URL in SSH format.
 * @return The remote URL in HTTPS format.
 */
export function toHTTPS (remoteUrl: string): string {
  const parsedRemote = parseRemoteUrl(remoteUrl);
  return `https://${parsedRemote[0]}/${parsedRemote[1]}`;
}

/**
 * Convert remote URL from HTTPS to SSH format.
 * @param remoteUrl The remote URL in HTTPS format.
 * @return The remote URL in SSH format.
 */
export function toSSH (remoteUrl: string): string {
  const parsedRemote = parseRemoteUrl(remoteUrl);
  return `git@${parsedRemote[0]}:${parsedRemote[1]}`;
}

/**
 * Split remote URL into host and path components for connection processing.
 * @param remoteUrl The remote URL; can accept SSH or HTTPS format.
 * @return Tuple containing the host and path values after string processing.
 */
export function parseRemoteUrl(remoteUrl: string): [string, string] {
  const _remoteUrl = remoteUrl.replace(/^git@/, 'ssh:git@');
  const parsedUrl = url.parse(_remoteUrl);
  const host = parsedUrl.host ? parsedUrl.host : '';
  const path = parsedUrl.path ? parsedUrl.path.replace(/^\/\:?/, '') : '';
  return [host, path];
}
