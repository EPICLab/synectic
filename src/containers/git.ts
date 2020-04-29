import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { v4 } from 'uuid';
import parsePath from 'parse-path';

import * as io from './io';
import { Repository, NarrowType } from '../types';
import { ActionKeys, Actions } from '../store/actions';

type AddOrUpdateRepoActions = NarrowType<Actions, ActionKeys.ADD_REPO | ActionKeys.UPDATE_REPO>;
type RepoPayload = { repo: (Repository | undefined); action: (AddOrUpdateRepoActions | undefined) };

export * from 'isomorphic-git';

/**
 * Get the name of the branch currently pointed to by .git/HEAD; this function is a wrapper to inject the 
 * fs parameter in to the isomorphic-git/currentBranch function.
 * @param dir The working tree directory path.
 * @param gitdir The git directory path.
 * @param fullname Boolean option to return the full path (e.g. "refs/heads/master") instead of the 
 * abbreviated form.
 * @param test Boolean option to return 'undefined' if the current branch doesn't actually exist 
 * (such as 'master' right after git init).
 * @return A Promise object containing the current branch name, or undefined if the HEAD is detached.
 */
export const currentBranch = ({ dir, gitdir, fullname, test }: {
  dir?: string;
  gitdir?: string;
  fullname?: boolean;
  test?: boolean;
}): Promise<string | void> => isogit.currentBranch({ fs: fs, dir: dir, gitdir: gitdir, fullname: fullname, test: test });

/**
 * Find the root Git directory. Starting at filepath, walks upward until it finds a directory that 
 * contains a subdirectory called '.git'.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root Git directory path, or undefined if no root Git
 * directory exists for the filepath (i.e. the filepath is not part of a Git repo).
 */
export const getRepoRoot = async (filepath: fs.PathLike) => {
  try {
    const root = await isogit.findRoot({ fs: fs, filepath: filepath.toString() });
    return root;
  }
  catch (e) {
    return undefined;
  }
};

/**
 * Asynchronous check for presence of .git within directory to validate Git version control.
 * @param filepath The relative or absolute path to evaluate. 
 * @return A Promise object containing true if filepath contains a .git subdirectory (or points 
 * directly to the .git directory), and false otherwise.
 */
export const isGitRepo = async (filepath: fs.PathLike) => {
  const stats = await io.extractStats(filepath);
  const directory = stats?.isDirectory() ? filepath.toString() : path.dirname(filepath.toString());
  if (directory === undefined) return false;
  const gitPath = (path.basename(directory) === '.git') ? directory : path.join(directory, '/.git');
  const gitStats = await io.extractStats(gitPath);
  if (gitStats === undefined) return false;
  else return true;
};

/**
 * Parse a URL to extract Git repository name, typically based on the remote origin URL.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns The repository name (e.g. 'username/repo').
 */
export const extractRepoName = (url: URL | string) => {
  const parsedPath = (typeof url === 'string') ? parsePath(url) : parsePath(url.href);
  return parsedPath.pathname.replace(/^(\/*)(?:snippets\/)?/, '').replace(/\.git$/, '');
};

/**
 * Parse a URL to extract components and protocols, along with the OAuth resource authority 
 * (GitHub, BitBucket, or GitLab) for processing with the isomorphic-git library module.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns A JavaScript object (key-value) with the parsePath.ParsedPath object and OAuth resource name.
 */
export const extractFromURL = (url: URL | string): { url: parsePath.ParsedPath; oauth: Repository['oauth'] } => {
  const parsedPath = (typeof url === 'string') ? parsePath(url) : parsePath(url.href);
  let oauth: Repository['oauth'] = 'github';
  switch (parsedPath.resource) {
    case (parsedPath.resource.match(/github\.com/) ? parsedPath.resource : undefined):
      oauth = 'github';
      break;
    case (parsedPath.resource.match(/bitbucket\.org/) ? parsedPath.resource : undefined):
      oauth = 'bitbucket';
      break;
    case (parsedPath.resource.match(/gitlab.*\.com/) ? parsedPath.resource : undefined):
      oauth = 'gitlab';
      break;
  }
  return { url: parsedPath, oauth: oauth };
}

/**
 * Determines whether a specific file is currently tracked by Git version control.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing a status indicator for whether a file has been changed; the possible 
 * resolve values are:
 *
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"ignored"`           | file ignored by a .gitignore rule                                                     |
 * | `"unmodified"`        | file unchanged from HEAD commit                                                       |
 * | `"*modified"`         | file has modifications, not yet staged                                                |
 * | `"*deleted"`          | file has been removed, but the removal is not yet staged                              |
 * | `"*added"`            | file is untracked, not yet staged                                                     |
 * | `"absent"`            | file not present in HEAD commit, staging area, or working dir                         |
 * | `"modified"`          | file has modifications, staged                                                        |
 * | `"deleted"`           | file has been removed, staged                                                         |
 * | `"added"`             | previously untracked file, staged                                                     |
 * | `"*unmodified"`       | working dir and HEAD commit match, but index differs                                  |
 * | `"*absent"`           | file not present in working dir or HEAD commit, but present in the index              |
 * | `"*undeleted"`        | file was deleted from the index, but is still in the working dir                      |
 * | `"*undeletemodified"` | file was deleted from the index, but is present with modifications in the working dir |
 */
export const getStatus = async (filepath: fs.PathLike) => {
  const repoRoot = await getRepoRoot(filepath);
  return isogit.status({ fs: fs, dir: '/', gitdir: repoRoot, filepath: filepath.toString() });
}

/**
 * Extract all necessary Git repository metadata from the root Git directory associated with the filepath, either 
 * by locating an existing repository and branch ref in the Redux state or creating Redux actions to add and 
 * update the state as needed.
 * @param filepath The relative or absolute path to evaluate; must be resolvable to a root Git directory.
 * @param repos The list of currently known Git repositories found in the Redux store.
 * @param ref (Optional) Git branch name; defaults to 'HEAD'.
 * @return A Promise object for a new or existing `Repository` object related to the root Git directory of the 
 * filepath, and any Redux actions that update state for either a new repository or an updated repository with a new 
 * branch ref. If the `repo` field is undefined, either no root Git directory exists or no remote origin URL has been 
 * set for the repo. If the `action` field is undefined, no updates to the Redux store are necessary.
 */
export const extractRepo = async (filepath: fs.PathLike, repos: Repository[], ref = 'HEAD'): Promise<RepoPayload> => {
  const rootDir = await getRepoRoot(filepath);
  if (!rootDir) return { repo: undefined, action: undefined };
  const remoteOriginUrls: string[] = await isogit.getConfigAll({ fs: fs, dir: rootDir.toString(), path: 'remote.origin.url' });
  if (remoteOriginUrls.length <= 0) return { repo: undefined, action: undefined };
  const { url, oauth } = extractFromURL(remoteOriginUrls[0]);
  const branches = await isogit.listBranches({ fs: fs, dir: rootDir.toString(), remote: 'origin' });
  const username = await isogit.getConfig({ fs: fs, dir: rootDir.toString(), path: 'user.name' });
  const password = await isogit.getConfig({ fs: fs, dir: rootDir.toString(), path: 'credential.helper' });

  const newRepo: Repository = {
    id: v4(),
    name: extractRepoName(url.href),
    corsProxy: new URL('https://cors-anywhere.herokuapp.com/'),
    url: url,
    refs: branches,
    oauth: oauth,
    username: username ? username : '',
    password: password ? password : '',
    token: ''
  };

  const existingRepo = repos.find(r => r.name === newRepo.name);
  const existingRef = existingRepo ? existingRepo.refs.find(r => r === ref) : undefined;

  if (existingRepo && existingRef) {
    return { repo: existingRepo, action: undefined };
  } else if (existingRepo && !existingRef) {
    const updatedRepo = { ...existingRepo, refs: [...existingRepo.refs, ref] };
    return { repo: updatedRepo, action: { type: ActionKeys.UPDATE_REPO, id: existingRepo.id, repo: updatedRepo } };
  } else {
    const updatedRepo = { ...newRepo, refs: [ref] };
    return { repo: updatedRepo, action: { type: ActionKeys.ADD_REPO, id: newRepo.id, repo: updatedRepo } };
  }
}