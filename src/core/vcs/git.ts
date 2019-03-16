import * as fs from 'fs-extra';
import * as path from 'path';
// import * as util from 'util';
import * as git from 'isomorphic-git';

// Lim requires a function that will compare a local file against the latest version on a git branch, and returns boolean for diff

// TODO: Capture 'git@github.com:SarmaResearch/synectic.git' URLs and convert to 'https://github.com/SarmaResearch/synectic'
// TODO: Create a CredentialManager for handling username/password or token/oauth2format information

/*
username: 'nelsonni',
password: 'XanfurbCave909',
token: '02382a038d912a9fc9fd88b7feb77d5084ff30f0'
*/

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
  let value = await git.config({
    dir: '/',
    path: 'user.name'
  });
  console.log('user-name: ' + value);
  return new Promise((resolve, _) => {
    resolve('test');
  });
}

/**
 * Read remote name and URL from Git directory path.
 * Git protocol allows multiple remotes to be set per repository.
 * @param gitdir The git directory path.
 * @return A list of git.RemoteDefinition objects, each containing `remote` and `url` fields.
 */
export async function getRemotes(gitdir: fs.PathLike): Promise<git.RemoteDefinition[]> {
  return await git.listRemotes({ dir: gitdir.toString() });
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
  let allBranches = new Set(local.concat(remote));
  return Array.from(allBranches.values());
}

/**
 * Asynchronously aggregate local branches based on Git repository.
 * @param gitdir The git directory path.
 * @return An array of local branch names for the Git repository.
 */
export async function getLocalBranches(gitdir: fs.PathLike): Promise<string[]> {
  return await git.listBranches({ dir: gitdir.toString() });
}

/**
 * Asynchronously aggregate remote branches based on Git repository.
 * @param gitdir The git directory path.
 * @return An array of remote branch names for the Git repository.
 */
export async function getRemoteBranches(gitdir: fs.PathLike): Promise<string[]> {
  return await git.listBranches({ dir: gitdir.toString(), remote: 'origin' });
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
  return new Promise((resolve, _) => {
    fs.stat(p)
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
}
